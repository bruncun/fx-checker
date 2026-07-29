import "server-only";

import { getCurrencyFlagCountryCode } from "@/features/converter/model/currencies";
import { getLatestRatesData } from "@/features/exchange-rates/api/server";
import { EXCHANGE_RATES_CACHE_TAG, getRates, type FrankfurterRate } from "@/lib/frankfurter";
import {
  getCachedLatestExchangeRateDataSnapshot,
  type CanonicalHistoryDataset,
} from "@/lib/latest-exchange-rate-data-snapshot";
import { cacheLife, cacheTag } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import {
  getDateYearsBefore,
  getRateHistoryRangeStartDate,
  type HistoryRange,
} from "../model/rate-history";

const RATE_HISTORY_YEARS = 5;

type DataResult<T> =
  | ({
      status: "available";
    } & T)
  | { status: "unavailable" };

export type HistoryPageData = DataResult<{
  historicalRates: FrankfurterRate[];
}>;

function getHistoryDataset(range: HistoryRange): CanonicalHistoryDataset {
  if (range === "5Y") {
    return "monthly-5y";
  }

  return range === "1Y" ? "weekly-1y" : "daily-3m";
}

function getCanonicalHistorySource(latestRates: FrankfurterRate[]) {
  const sharedBaseCurrency = latestRates[0]?.base;

  if (!sharedBaseCurrency || latestRates.some((rate) => rate.base !== sharedBaseCurrency)) {
    return null;
  }

  const quotes = [
    ...new Set(
      latestRates
        .map((rate) => rate.quote)
        .filter(
          (currency) =>
            currency !== sharedBaseCurrency && getCurrencyFlagCountryCode(currency) !== undefined
        )
    ),
  ].sort();

  if (quotes.length === 0) {
    return null;
  }

  const quoteSet = new Set(quotes);
  const sourceVersion = latestRates
    .filter((rate) => quoteSet.has(rate.quote))
    .map((rate) => `${rate.date}:${rate.base}:${rate.quote}:${rate.rate}`)
    .sort()
    .join("|");

  return sourceVersion ? { quotes, sourceVersion } : null;
}

export async function getHistoryPageData({
  range,
}: {
  range: HistoryRange;
}): Promise<HistoryPageData> {
  const dataSnapshot = await getCachedLatestExchangeRateDataSnapshot(getHistoryDataset(range));

  if (dataSnapshot) {
    return {
      historicalRates: dataSnapshot.rates,
      status: "available",
    };
  }

  try {
    const latestRatesData = await getLatestRatesData();

    if (latestRatesData.status === "unavailable") {
      return { status: "unavailable" };
    }

    return getHistoryPageDataForLatestRates(latestRatesData.rates, range);
  } catch (error) {
    unstable_rethrow(error);
    return { status: "unavailable" };
  }
}

export async function getHistoryPageDataForLatestRates(
  latestRates: FrankfurterRate[],
  range: HistoryRange
): Promise<HistoryPageData> {
  const latestDate = latestRates[0]?.date;
  const source = getCanonicalHistorySource(latestRates);

  if (!latestDate || !source) {
    return { status: "unavailable" };
  }

  try {
    return await loadCanonicalHistoryPageData({
      dataset: getHistoryDataset(range),
      latestDate,
      quotes: source.quotes,
      sourceVersion: source.sourceVersion,
    });
  } catch (error) {
    unstable_rethrow(error);
    return { status: "unavailable" };
  }
}

async function loadCanonicalHistoryPageData({
  dataset,
  latestDate,
  quotes,
  sourceVersion,
}: {
  dataset: CanonicalHistoryDataset;
  latestDate: string;
  quotes: string[];
  sourceVersion: string;
}): Promise<HistoryPageData> {
  "use cache: remote";
  cacheLife("days");
  cacheTag(EXCHANGE_RATES_CACHE_TAG);

  const historyStartDate =
    dataset === "daily-3m"
      ? getRateHistoryRangeStartDate(latestDate, "3M")
      : getDateYearsBefore(latestDate, dataset === "monthly-5y" ? RATE_HISTORY_YEARS : 1);

  if (!historyStartDate || !sourceVersion) {
    throw new Error("Canonical exchange rate history has no valid source range");
  }

  const historicalRates = await getRates({
    from: historyStartDate,
    group: dataset === "monthly-5y" ? "month" : dataset === "weekly-1y" ? "week" : undefined,
    quotes,
    to: latestDate,
  });

  if (historicalRates.length === 0) {
    throw new Error(`Frankfurter returned no rates for ${dataset}`);
  }

  return {
    status: "available",
    historicalRates,
  };
}
