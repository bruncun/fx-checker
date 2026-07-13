import "server-only";

import { getLatestRatesData } from "@/features/exchange-rates/api/server";
import { EXCHANGE_RATES_CACHE_TAG, getRates, type FrankfurterRate } from "@/lib/frankfurter";
import { cacheLife, cacheTag } from "next/cache";
import {
  getDateYearsBefore,
  getRateHistoryRangeStartDate,
  type HistoryRange,
} from "../model/rate-history";

const RATE_HISTORY_YEARS = 5;

type DateRange = {
  from: string;
  to: string;
};

type DataResult<T> =
  | ({
      status: "available";
    } & T)
  | { status: "unavailable" };

export type HistoryPageData = DataResult<{
  historicalRates: FrankfurterRate[];
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

function addYears(date: Date, years: number) {
  const nextDate = new Date(date);

  nextDate.setUTCFullYear(nextDate.getUTCFullYear() + years);

  return nextDate;
}

function getPreviousDate(date: Date) {
  const previousDate = new Date(date);

  previousDate.setUTCDate(previousDate.getUTCDate() - 1);

  return previousDate;
}

export function getYearlyDateRanges({
  from,
  years,
  to,
}: {
  from: string;
  years: number;
  to: string;
}): DateRange[] {
  const startDate = parseIsoDate(from);
  const endDate = parseIsoDate(to);

  if (!startDate || !endDate || startDate > endDate || years < 1) {
    return [];
  }

  const ranges: DateRange[] = [];

  for (let index = 0; index < years; index += 1) {
    const rangeStartDate = addYears(startDate, index);
    const nextRangeStartDate = addYears(startDate, index + 1);
    const rangeEndDate = index === years - 1 ? endDate : getPreviousDate(nextRangeStartDate);

    if (rangeStartDate > endDate) {
      break;
    }

    const clampedRangeEndDate = rangeEndDate < endDate ? rangeEndDate : endDate;

    ranges.push({
      from: formatIsoDate(rangeStartDate),
      to: formatIsoDate(clampedRangeEndDate),
    });
  }

  return ranges;
}

async function getHistoricalRates({
  from,
  quotes,
  range,
  to,
}: DateRange & {
  quotes: string[];
  range: HistoryRange;
}) {
  if (range !== "5Y") {
    return getRates({ from, quotes, to });
  }

  const ranges = getYearlyDateRanges({ from, to, years: RATE_HISTORY_YEARS });
  const rateGroups = await Promise.all(
    ranges.map((dateRange) => getRates({ ...dateRange, quotes }))
  );

  return rateGroups.flat();
}

function getHistoryQuotes({
  baseCurrency,
  fallbackQuoteCurrency,
  quoteCurrency,
  sharedBaseCurrency,
}: {
  baseCurrency: string;
  fallbackQuoteCurrency: string;
  quoteCurrency: string;
  sharedBaseCurrency: string;
}) {
  const quotes = [
    ...new Set([baseCurrency, quoteCurrency].filter((currency) => currency !== sharedBaseCurrency)),
  ];

  return quotes.length > 0 ? quotes : [fallbackQuoteCurrency];
}

export async function getHistoryPageData({
  baseCurrency,
  quoteCurrency,
  range,
}: {
  baseCurrency: string;
  quoteCurrency: string;
  range: HistoryRange;
}): Promise<HistoryPageData> {
  try {
    const latestRatesData = await getLatestRatesData();

    if (latestRatesData.status === "unavailable") {
      return { status: "unavailable" };
    }

    return getHistoryPageDataForLatestRates({
      baseCurrency,
      latestRates: latestRatesData.rates,
      quoteCurrency,
      range,
    });
  } catch {
    return { status: "unavailable" };
  }
}

async function getHistoryPageDataForLatestRates({
  baseCurrency,
  latestRates,
  quoteCurrency,
  range,
}: {
  baseCurrency: string;
  latestRates: FrankfurterRate[];
  quoteCurrency: string;
  range: HistoryRange;
}): Promise<HistoryPageData> {
  "use cache";
  cacheLife("days");
  cacheTag(EXCHANGE_RATES_CACHE_TAG);

  try {
    const latestRate = latestRates[0];
    const latestDate = latestRate?.date;
    const historyStartDate = latestDate
      ? range === "5Y"
        ? getDateYearsBefore(latestDate, RATE_HISTORY_YEARS)
        : getRateHistoryRangeStartDate(latestDate, range)
      : null;

    if (!latestRate || !latestDate || !historyStartDate) {
      return { status: "unavailable" };
    }

    const historicalRates = await getHistoricalRates({
      from: historyStartDate,
      quotes: getHistoryQuotes({
        baseCurrency,
        fallbackQuoteCurrency: latestRate.quote,
        quoteCurrency,
        sharedBaseCurrency: latestRate.base,
      }),
      range,
      to: latestDate,
    });

    return {
      status: "available",
      historicalRates,
    };
  } catch {
    return { status: "unavailable" };
  }
}
