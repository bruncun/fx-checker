import "server-only";

import {
  deriveAvailableCurrencies,
  type AvailableCurrency,
} from "@/features/converter/model/currencies";
import type { LiveRate } from "@/features/live-rates/components/live-rate-item";
import { deriveLiveRates } from "@/features/live-rates/model/live-rates";
import {
  EXCHANGE_RATES_CACHE_TAG,
  getCurrencies,
  getRates,
  type FrankfurterRate,
} from "@/lib/frankfurter";
import {
  getLatestExchangeRateSnapshot,
  saveLatestExchangeRateSnapshot,
} from "@/lib/latest-exchange-rate-snapshot";
import { cacheLife, cacheTag } from "next/cache";
import { after } from "next/server";

const LIVE_RATE_LOOKBACK_DAYS = 7;

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
  try {
    return await getFreshLatestRatesData();
  } catch {
    try {
      const snapshot = await getLatestExchangeRateSnapshot();

      return snapshot
        ? {
            freshness: {
              dataStatus: "stale",
              fetchedAt: snapshot.fetchedAt,
              source: "last_known_good",
            },
            rates: snapshot.rates,
            status: "available",
          }
        : { status: "unavailable" };
    } catch {
      return { status: "unavailable" };
    }
  }
}

async function getFreshLatestRatesData(): Promise<LatestRatesData> {
  "use cache";
  cacheLife("days");
  cacheTag(EXCHANGE_RATES_CACHE_TAG);

  const rates = await getRates();

  if (rates.length === 0) {
    return { status: "unavailable" };
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
  } catch {
    return { status: "unavailable" };
  }
}

export async function getCurrencyReferenceDataForLatestRates(
  latestRates: FrankfurterRate[]
): Promise<CurrencyReferenceData> {
  const currencies = await getCurrencies();

  return deriveCurrencyReferenceDataForLatestRates(currencies, latestRates);
}

async function deriveCurrencyReferenceDataForLatestRates(
  currencies: Awaited<ReturnType<typeof getCurrencies>>,
  latestRates: FrankfurterRate[]
): Promise<CurrencyReferenceData> {
  "use cache";
  cacheLife("days");
  cacheTag(EXCHANGE_RATES_CACHE_TAG);

  try {
    const availableCurrencies = deriveAvailableCurrencies(currencies, latestRates);

    if (availableCurrencies.length < 2) {
      return { status: "unavailable" };
    }

    return {
      status: "available",
      availableCurrencies,
      currencyCount: availableCurrencies.length,
    };
  } catch {
    return { status: "unavailable" };
  }
}

export async function getLiveRatesData(): Promise<LiveRatesData> {
  try {
    const latestRatesData = await getLatestRatesData();

    if (latestRatesData.status === "unavailable") {
      return { status: "unavailable" };
    }

    return getLiveRatesDataForLatestRates(latestRatesData.rates);
  } catch {
    return { status: "unavailable" };
  }
}

export async function getLiveRatesDataForLatestRates(
  latestRates: FrankfurterRate[]
): Promise<LiveRatesData> {
  "use cache";
  cacheLife("days");
  cacheTag(EXCHANGE_RATES_CACHE_TAG);

  try {
    const latestDate = latestRates[0]?.date;
    const lookbackStartDate = latestDate
      ? getDateDaysBefore(latestDate, LIVE_RATE_LOOKBACK_DAYS)
      : null;

    if (!latestDate || !lookbackStartDate) {
      return { status: "unavailable" };
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
  } catch {
    return { status: "unavailable" };
  }
}
