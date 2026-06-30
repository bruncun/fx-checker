import Decimal from "decimal.js-light";

import type { FrankfurterRate } from "@/lib/frankfurter";

export type HistoryRange = "1D" | "1W" | "1M" | "3M" | "1Y" | "5Y";

export type RateHistoryPoint = {
  date: string;
  rate: number;
};

export type RateHistoryStat = {
  direction?: "up" | "down";
  label: string;
  showIndicator?: boolean;
  value: string;
};

export type RateHistoryData = {
  pair: string;
  points: RateHistoryPoint[];
};

const RateHistoryDecimal = Decimal.clone({ precision: 40 });

export const historyRanges: HistoryRange[] = ["1D", "1W", "1M", "3M", "1Y", "5Y"];

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

export function getDateYearsBefore(date: string, years: number) {
  const targetDate = parseIsoDate(date);

  if (!targetDate) {
    return null;
  }

  targetDate.setUTCFullYear(targetDate.getUTCFullYear() - years);

  return formatIsoDate(targetDate);
}

function getRangeStartDate(date: string, range: HistoryRange) {
  const targetDate = parseIsoDate(date);

  if (!targetDate) {
    return null;
  }

  if (range === "1D") {
    targetDate.setUTCDate(targetDate.getUTCDate() - 1);
  } else if (range === "1W") {
    targetDate.setUTCDate(targetDate.getUTCDate() - 7);
  } else if (range === "1M") {
    targetDate.setUTCMonth(targetDate.getUTCMonth() - 1);
  } else if (range === "3M") {
    targetDate.setUTCMonth(targetDate.getUTCMonth() - 3);
  } else if (range === "1Y") {
    targetDate.setUTCFullYear(targetDate.getUTCFullYear() - 1);
  } else {
    targetDate.setUTCFullYear(targetDate.getUTCFullYear() - 5);
  }

  return formatIsoDate(targetDate);
}

function formatSignedRateChange(value: number) {
  return `${value >= 0 ? "+" : ""}${value.toFixed(4)}`;
}

function formatSignedPercentChange(value: number) {
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
}

export function getRateHistoryStats(points: RateHistoryPoint[]): RateHistoryStat[] {
  const firstPoint = points[0];
  const lastPoint = points.at(-1);

  if (!firstPoint || !lastPoint) {
    return [];
  }

  const change = lastPoint.rate - firstPoint.rate;
  const percentChange = firstPoint.rate === 0 ? 0 : (change / firstPoint.rate) * 100;
  const direction = change >= 0 ? "up" : "down";

  return [
    { label: "Open", value: firstPoint.rate.toFixed(4) },
    { label: "Last", value: lastPoint.rate.toFixed(4) },
    { direction, label: "Change", showIndicator: false, value: formatSignedRateChange(change) },
    {
      direction,
      label: "% Change",
      showIndicator: true,
      value: formatSignedPercentChange(percentChange),
    },
  ];
}

function getSharedBase(rates: FrankfurterRate[]) {
  const sharedBase = rates[0]?.base;

  if (!sharedBase || rates.some((rate) => rate.base !== sharedBase)) {
    return null;
  }

  return sharedBase;
}

function groupRatesByDate(rates: FrankfurterRate[], sharedBase: string) {
  const ratesByDate = new Map<string, Map<string, Decimal>>();

  for (const rate of rates) {
    const ratesByCurrency =
      ratesByDate.get(rate.date) ??
      new Map<string, Decimal>([[sharedBase, new RateHistoryDecimal(1)]]);

    ratesByCurrency.set(rate.quote, new RateHistoryDecimal(rate.rate));
    ratesByDate.set(rate.date, ratesByCurrency);
  }

  return [...ratesByDate.entries()].sort(([leftDate], [rightDate]) =>
    leftDate.localeCompare(rightDate)
  );
}

function derivePairRate(
  ratesByCurrency: Map<string, Decimal>,
  baseCurrency: string,
  quoteCurrency: string
) {
  if (baseCurrency === quoteCurrency) {
    return new RateHistoryDecimal(1);
  }

  const baseRate = ratesByCurrency.get(baseCurrency);
  const quoteRate = ratesByCurrency.get(quoteCurrency);

  if (!baseRate || !quoteRate) {
    return null;
  }

  return quoteRate.div(baseRate);
}

export function getRateHistoryRangePoints(points: RateHistoryPoint[], range: HistoryRange) {
  const latestDate = points.at(-1)?.date;
  const rangeStartDate = latestDate ? getRangeStartDate(latestDate, range) : null;

  if (!rangeStartDate) {
    return [];
  }

  return points.filter((point) => point.date >= rangeStartDate);
}

export function deriveRateHistoryData({
  baseCurrency,
  quoteCurrency,
  rates,
}: {
  baseCurrency: string;
  quoteCurrency: string;
  rates: FrankfurterRate[];
}): RateHistoryData | null {
  const sharedBase = getSharedBase(rates);

  if (!sharedBase) {
    return null;
  }

  const points = groupRatesByDate(rates, sharedBase).flatMap(([date, ratesByCurrency]) => {
    const rate = derivePairRate(ratesByCurrency, baseCurrency, quoteCurrency);

    return rate ? [{ date, rate: rate.toNumber() }] : [];
  });

  if (points.length === 0) {
    return null;
  }

  return {
    pair: `${baseCurrency}/${quoteCurrency}`,
    points,
  };
}
