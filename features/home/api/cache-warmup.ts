import {
  getCurrencyReferenceDataForLatestRates,
  getFreshLatestRatesData,
  getLiveRatesDataForLatestRates,
} from "@/features/exchange-rates/api/server";
import { getHistoryPageDataForLatestRates } from "@/features/rate-history/api/server";
import { FRANKFURTER_LATEST_RATES_SOURCE_CACHE_TAG, type FrankfurterRate } from "@/lib/frankfurter";
import {
  getCachedLatestExchangeRateDataSnapshot,
  LATEST_EXCHANGE_RATE_DATA_SNAPSHOT_CACHE_TAG,
  saveLatestExchangeRateDataSnapshot,
  type CanonicalHistoryDataset,
} from "@/lib/latest-exchange-rate-data-snapshot";
import { revalidateTag } from "next/cache";

const WARMUP_MAX_ATTEMPTS = 3;
const WARMUP_RETRY_DELAYS_MS = [500, 1_500];

type WarmupStatus = "available" | "unavailable";
type WarmableResult = { status: WarmupStatus };

type WarmupStepDiagnostic = {
  attempts: number;
  durationMs: number;
  rowCount?: number;
  status: WarmupStatus;
};

type WarmupStepOutcome<T extends WarmableResult> = {
  diagnostic: WarmupStepDiagnostic;
  value: Extract<T, { status: "available" }> | null;
};

export type FrankfurterCacheWarmupResult = {
  diagnostics: {
    currencyReferenceData: WarmupStepDiagnostic;
    historicalRates: Record<CanonicalHistoryDataset, WarmupStepDiagnostic>;
    latestRates: WarmupStepDiagnostic;
    liveRates: WarmupStepDiagnostic;
    snapshotPublication: WarmupStepDiagnostic;
  };
  durationMs: number;
  ok: boolean;
  results: {
    currencyReferenceData: WarmupStatus;
    historicalRates: WarmupStatus;
    latestRates: WarmupStatus;
    liveRates: WarmupStatus;
  };
  sourceDate: string | null;
};

function getWarmupContext() {
  return {
    deployment: process.env.VERCEL_DEPLOYMENT_ID ?? process.env.VERCEL_GIT_COMMIT_SHA ?? "local",
    region: process.env.VERCEL_REGION ?? "local",
  };
}

function getLatestSourceDate(rates: FrankfurterRate[]) {
  return rates.reduce<string | null>(
    (latestDate, rate) => (latestDate === null || rate.date > latestDate ? rate.date : latestDate),
    null
  );
}

function waitBeforeRetry(attempt: number) {
  const delayMs = process.env.NODE_ENV === "test" ? 0 : (WARMUP_RETRY_DELAYS_MS[attempt - 1] ?? 0);

  return delayMs > 0
    ? new Promise<void>((resolve) => {
        setTimeout(resolve, delayMs);
      })
    : Promise.resolve();
}

async function runWarmupStep<T extends WarmableResult>({
  getRowCount,
  operation,
  sourceDate,
  step,
}: {
  getRowCount?: (value: Extract<T, { status: "available" }>) => number;
  operation: () => Promise<T>;
  sourceDate: string | null;
  step: string;
}): Promise<WarmupStepOutcome<T>> {
  const startedAt = Date.now();
  let attempts = 0;
  let lastError: unknown;

  for (let attempt = 1; attempt <= WARMUP_MAX_ATTEMPTS; attempt += 1) {
    attempts = attempt;

    try {
      const value = await operation();

      if (value.status === "available") {
        const availableValue = value as Extract<T, { status: "available" }>;
        const diagnostic = {
          attempts,
          durationMs: Date.now() - startedAt,
          rowCount: getRowCount?.(availableValue),
          status: "available" as const,
        };

        console.info("Frankfurter warmup step completed", {
          ...getWarmupContext(),
          ...diagnostic,
          sourceDate,
          step,
        });

        return {
          diagnostic,
          value: availableValue,
        };
      }

      lastError = new Error(`${step} returned unavailable`);
    } catch (error) {
      lastError = error;
    }

    console.warn("Frankfurter warmup step attempt failed", {
      ...getWarmupContext(),
      attempt,
      cause: lastError instanceof Error ? lastError.message : String(lastError),
      sourceDate,
      step,
    });

    if (attempt < WARMUP_MAX_ATTEMPTS) {
      await waitBeforeRetry(attempt);
    }
  }

  const diagnostic = {
    attempts,
    durationMs: Date.now() - startedAt,
    status: "unavailable" as const,
  };

  console.error("Frankfurter warmup step failed", {
    ...getWarmupContext(),
    ...diagnostic,
    cause: lastError instanceof Error ? lastError.message : String(lastError),
    sourceDate,
    step,
  });

  return {
    diagnostic,
    value: null,
  };
}

function unavailableDiagnostic(): WarmupStepDiagnostic {
  return {
    attempts: 0,
    durationMs: 0,
    status: "unavailable",
  };
}

export async function warmFrankfurterCache(): Promise<FrankfurterCacheWarmupResult> {
  const startedAt = Date.now();

  // Only latest rates are mutable at a stable URL. Dated history URLs remain
  // intact until a complete replacement snapshot has been published.
  revalidateTag(FRANKFURTER_LATEST_RATES_SOURCE_CACHE_TAG, { expire: 0 });

  const latestRatesOutcome = await runWarmupStep({
    getRowCount: (value) => value.rates.length,
    operation: getFreshLatestRatesData,
    sourceDate: null,
    step: "latest-rates",
  });
  const sourceDate = latestRatesOutcome.value
    ? getLatestSourceDate(latestRatesOutcome.value.rates)
    : null;

  if (!latestRatesOutcome.value || !sourceDate) {
    const results = {
      currencyReferenceData: "unavailable" as const,
      historicalRates: "unavailable" as const,
      latestRates: "unavailable" as const,
      liveRates: "unavailable" as const,
    };
    const result = {
      diagnostics: {
        currencyReferenceData: unavailableDiagnostic(),
        historicalRates: {
          "daily-3m": unavailableDiagnostic(),
          "monthly-5y": unavailableDiagnostic(),
          "weekly-1y": unavailableDiagnostic(),
        },
        latestRates: latestRatesOutcome.diagnostic,
        liveRates: unavailableDiagnostic(),
        snapshotPublication: unavailableDiagnostic(),
      },
      durationMs: Date.now() - startedAt,
      ok: false,
      results,
      sourceDate,
    };

    console.error("Frankfurter warmup failed before dependent datasets", {
      ...getWarmupContext(),
      durationMs: result.durationMs,
      sourceDate,
    });

    return result;
  }

  const freshLatestRatesData = latestRatesOutcome.value;
  const latestRates = freshLatestRatesData.rates;
  const [
    currencyReferenceOutcome,
    liveRatesOutcome,
    dailyHistoryOutcome,
    weeklyHistoryOutcome,
    monthlyHistoryOutcome,
  ] = await Promise.all([
    runWarmupStep({
      getRowCount: (value) => value.currencyCount,
      operation: () => getCurrencyReferenceDataForLatestRates(latestRates),
      sourceDate,
      step: "currency-reference",
    }),
    runWarmupStep({
      getRowCount: (value) => value.liveRateHistoryRates.length,
      operation: () => getLiveRatesDataForLatestRates(latestRates),
      sourceDate,
      step: "live-rates",
    }),
    runWarmupStep({
      getRowCount: (value) => value.historicalRates.length,
      operation: () => getHistoryPageDataForLatestRates(latestRates, "3M"),
      sourceDate,
      step: "history-daily-3m",
    }),
    runWarmupStep({
      getRowCount: (value) => value.historicalRates.length,
      operation: () => getHistoryPageDataForLatestRates(latestRates, "1Y"),
      sourceDate,
      step: "history-weekly-1y",
    }),
    runWarmupStep({
      getRowCount: (value) => value.historicalRates.length,
      operation: () => getHistoryPageDataForLatestRates(latestRates, "5Y"),
      sourceDate,
      step: "history-monthly-5y",
    }),
  ]);

  const historicalRates =
    dailyHistoryOutcome.value && weeklyHistoryOutcome.value && monthlyHistoryOutcome.value
      ? {
          "daily-3m": dailyHistoryOutcome.value.historicalRates,
          "monthly-5y": monthlyHistoryOutcome.value.historicalRates,
          "weekly-1y": weeklyHistoryOutcome.value.historicalRates,
        }
      : null;

  const snapshotPublicationOutcome = historicalRates
    ? await runWarmupStep({
        getRowCount: (value) => value.rowCount,
        operation: async () => {
          await saveLatestExchangeRateDataSnapshot({
            fetchedAt: freshLatestRatesData.freshness.fetchedAt,
            historicalRates,
            latestRates,
            sourceDate,
          });

          revalidateTag(LATEST_EXCHANGE_RATE_DATA_SNAPSHOT_CACHE_TAG, { expire: 0 });

          const primedSnapshots = await Promise.all(
            (["latest", "daily-3m", "weekly-1y", "monthly-5y"] as const).map((dataset) =>
              getCachedLatestExchangeRateDataSnapshot(dataset)
            )
          );

          if (primedSnapshots.some((snapshot) => !snapshot || snapshot.sourceDate !== sourceDate)) {
            return { status: "unavailable" as const };
          }

          return {
            rowCount: primedSnapshots.reduce(
              (total, snapshot) => total + (snapshot?.rates.length ?? 0),
              0
            ),
            status: "available" as const,
          };
        },
        sourceDate,
        step: "snapshot-publication",
      })
    : {
        diagnostic: unavailableDiagnostic(),
        value: null,
      };

  const results = {
    currencyReferenceData: currencyReferenceOutcome.diagnostic.status,
    historicalRates: snapshotPublicationOutcome.diagnostic.status,
    latestRates: latestRatesOutcome.diagnostic.status,
    liveRates: liveRatesOutcome.diagnostic.status,
  };
  const result = {
    diagnostics: {
      currencyReferenceData: currencyReferenceOutcome.diagnostic,
      historicalRates: {
        "daily-3m": dailyHistoryOutcome.diagnostic,
        "monthly-5y": monthlyHistoryOutcome.diagnostic,
        "weekly-1y": weeklyHistoryOutcome.diagnostic,
      },
      latestRates: latestRatesOutcome.diagnostic,
      liveRates: liveRatesOutcome.diagnostic,
      snapshotPublication: snapshotPublicationOutcome.diagnostic,
    },
    durationMs: Date.now() - startedAt,
    ok: Object.values(results).every((status) => status === "available"),
    results,
    sourceDate,
  };

  console.info("Frankfurter warmup completed", {
    ...getWarmupContext(),
    durationMs: result.durationMs,
    ok: result.ok,
    results,
    sourceDate,
  });

  return result;
}
