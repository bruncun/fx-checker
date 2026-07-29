import "server-only";

import {
  deriveAvailableCurrencies,
  type AvailableCurrency,
} from "@/features/converter/model/currencies";
import type { LiveRate } from "@/features/live-rates/components/live-rate-item";
import { deriveLiveRates } from "@/features/live-rates/model/live-rates";
import {
  EXCHANGE_RATES_CACHE_TAG,
  FRANKFURTER_LATEST_RATES_SOURCE_CACHE_TAG,
  getCurrencies,
  getRates,
  type FrankfurterRate,
} from "@/lib/frankfurter";
import { getCachedLatestExchangeRateDataSnapshot } from "@/lib/latest-exchange-rate-data-snapshot";
import {
  getLatestExchangeRateSnapshot,
  saveLatestExchangeRateSnapshot,
} from "@/lib/latest-exchange-rate-snapshot";
import { cacheLife, cacheTag } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import { after } from "next/server";

const LIVE_RATE_LOOKBACK_DAYS = 7;
const MATERIALIZED_SNAPSHOT_STALE_AFTER_MS = 36 * 60 * 60 * 1000;

type DataResult<T> =
  | ({
      status: "available";
    } & T)
  | { status: "unavailable" };

type ExchangeRateDataFreshness = {
  dataStatus: "fresh" | "stale";
  fetchedAt: string;
  source: "api" | "last_known_good";
};

export type CurrencyReferenceData = DataResult<{
  availableCurrencies: AvailableCurrency[];
  currencyCount: number;
}>;

export type LatestRatesData = DataResult<{
  freshness: ExchangeRateDataFreshness;
  rates: FrankfurterRate[];
}>;

export type LiveRatesData = DataResult<{
  liveRateHistoryRates: FrankfurterRate[];
  liveRates: LiveRate[];
}>;

function parseIsoDate(date: string) {
  const [year, month, day] = date.split("-").map(Number);

  if (!year || !month || !day) {
    return null;
  }

  return new Date(Date.UTC(year, month - 1, day));
}

function formatIsoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function subtractDays(date: Date, days: number) {
  const previousDate = new Date(date);

  previousDate.setUTCDate(previousDate.getUTCDate() - days);

  return previousDate;
}

function getDateDaysBefore(date: string, days: number) {
  const targetDate = parseIsoDate(date);

  return targetDate ? formatIsoDate(subtractDays(targetDate, days)) : null;
}

export async function getLatestRatesData(): Promise<LatestRatesData> {
  const dataSnapshot = await getCachedLatestExchangeRateDataSnapshot("latest");

  if (dataSnapshot) {
    const fetchedAt = Date.parse(dataSnapshot.fetchedAt);
    const isStale =
      !Number.isFinite(fetchedAt) || Date.now() - fetchedAt > MATERIALIZED_SNAPSHOT_STALE_AFTER_MS;

    return {
      freshness: {
        dataStatus: isStale ? "stale" : "fresh",
        fetchedAt: dataSnapshot.fetchedAt,
        source: isStale ? "last_known_good" : "api",
      },
      rates: dataSnapshot.rates,
      status: "available",
    };
  }

  try {
    const snapshot = await getLatestExchangeRateSnapshot();

    if (snapshot) {
      return {
        freshness: {
          dataStatus: "stale",
          fetchedAt: snapshot.fetchedAt,
          source: "last_known_good",
        },
        rates: snapshot.rates,
        status: "available",
      };
    }
  } catch (error) {
    unstable_rethrow(error);
    console.error("Failed to read latest exchange rate fallback snapshot", {
      cause: error instanceof Error ? error.message : String(error),
    });
  }

  try {
    return await getFreshLatestRatesData();
  } catch (error) {
    unstable_rethrow(error);
    return { status: "unavailable" };
  }
}

export async function getFreshLatestRatesData(): Promise<LatestRatesData> {
  "use cache: remote";
  cacheLife("days");
  cacheTag(FRANKFURTER_LATEST_RATES_SOURCE_CACHE_TAG);

  const rates = await getRates();

  if (rates.length === 0) {
    throw new Error("Frankfurter returned no latest exchange rates");
  }

  const fetchedAt = new Date().toISOString();

  after(async () => {
    try {
      await saveLatestExchangeRateSnapshot(rates, fetchedAt);
    } catch (error) {
      console.error("Failed to persist latest exchange rate snapshot", {
        cause: error instanceof Error ? error.message : String(error),
      });
    }
  });

  return {
    freshness: {
      dataStatus: "fresh",
      fetchedAt,
      source: "api",
    },
    rates,
    status: "available",
  };
}

export async function getCurrencyReferenceData(): Promise<CurrencyReferenceData> {
  try {
    const [currencies, latestRatesData] = await Promise.all([
      getCurrencies(),
      getLatestRatesData(),
    ]);

    if (latestRatesData.status === "unavailable") {
      return { status: "unavailable" };
    }

    return deriveCurrencyReferenceDataForLatestRates(currencies, latestRatesData.rates);
  } catch (error) {
    unstable_rethrow(error);
    return { status: "unavailable" };
  }
}

export async function getCurrencyReferenceDataForLatestRates(
  latestRates: FrankfurterRate[]
): Promise<CurrencyReferenceData> {
  try {
    const currencies = await getCurrencies();

    return await deriveCurrencyReferenceDataForLatestRates(currencies, latestRates);
  } catch (error) {
    unstable_rethrow(error);
    return { status: "unavailable" };
  }
}

async function deriveCurrencyReferenceDataForLatestRates(
  currencies: Awaited<ReturnType<typeof getCurrencies>>,
  latestRates: FrankfurterRate[]
): Promise<CurrencyReferenceData> {
  "use cache: remote";
  cacheLife("days");
  cacheTag(EXCHANGE_RATES_CACHE_TAG);

  const availableCurrencies = deriveAvailableCurrencies(currencies, latestRates);

  if (availableCurrencies.length < 2) {
    return { status: "unavailable" };
  }

  return {
    status: "available",
    availableCurrencies,
    currencyCount: availableCurrencies.length,
  };
}

export async function getLiveRatesData(): Promise<LiveRatesData> {
  try {
    const latestRatesData = await getLatestRatesData();

    if (latestRatesData.status === "unavailable") {
      return { status: "unavailable" };
    }

    return getLiveRatesDataForLatestRates(latestRatesData.rates);
  } catch (error) {
    unstable_rethrow(error);
    return { status: "unavailable" };
  }
}

export async function getLiveRatesDataForLatestRates(
  latestRates: FrankfurterRate[]
): Promise<LiveRatesData> {
  try {
    return await loadLiveRatesDataForLatestRates(latestRates);
  } catch (error) {
    unstable_rethrow(error);
    return { status: "unavailable" };
  }
}

async function loadLiveRatesDataForLatestRates(
  latestRates: FrankfurterRate[]
): Promise<LiveRatesData> {
  "use cache: remote";
  cacheLife("days");
  cacheTag(EXCHANGE_RATES_CACHE_TAG);

  const latestDate = latestRates[0]?.date;
  const lookbackStartDate = latestDate
    ? getDateDaysBefore(latestDate, LIVE_RATE_LOOKBACK_DAYS)
    : null;

  if (!latestDate || !lookbackStartDate) {
    throw new Error("Latest exchange rates have no valid source date");
  }

  const recentRates = await getRates({
    from: lookbackStartDate,
    to: latestDate,
  });
  const liveRateHistoryRates = recentRates.filter((rate) => rate.date < latestDate);
  const liveRates = deriveLiveRates({
    historicalRates: liveRateHistoryRates,
    latestRates,
  });

  return {
    status: "available",
    liveRateHistoryRates,
    liveRates,
  };
}
