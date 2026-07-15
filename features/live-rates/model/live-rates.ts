import Decimal from "decimal.js-light";

import type { FrankfurterRate } from "@/lib/frankfurter";
import type { LiveRate } from "../components/live-rate-item";

const LiveRateDecimal = Decimal.clone({ precision: 40 });

const liveRatePairs = [
  ["EUR", "USD"],
  ["USD", "JPY"],
  ["GBP", "USD"],
  ["USD", "CHF"],
  ["EUR", "GBP"],
  ["AUD", "USD"],
  ["USD", "CAD"],
] as const;

function getSharedBase(rates: FrankfurterRate[]) {
  const sharedBase = rates[0]?.base;

  if (!sharedBase || rates.some((rate) => rate.base !== sharedBase)) {
    return null;
  }

  return sharedBase;
}

function getRateByCurrency(rates: FrankfurterRate[]) {
  const sharedBase = getSharedBase(rates);

  if (!sharedBase) {
    return null;
  }

  return new Map<string, Decimal>([
    [sharedBase, new LiveRateDecimal(1)],
    ...rates.map((rate) => [rate.quote, new LiveRateDecimal(rate.rate)] as const),
  ]);
}

function derivePairRate(
  ratesByCurrency: Map<string, Decimal>,
  base: string,
  quote: string
): Decimal | null {
  const baseRate = ratesByCurrency.get(base);
  const quoteRate = ratesByCurrency.get(quote);

  if (!baseRate || !quoteRate) {
    return null;
  }

  return quoteRate.div(baseRate);
}

function formatLiveRate(rate: Decimal) {
  if (rate.gte(100)) {
    return rate.toDecimalPlaces(2).toFixed(2);
  }

  if (rate.lt(0.0001)) {
    return rate.toSignificantDigits(4).toFixed();
  }

  return rate.toDecimalPlaces(4).toFixed(4);
}

function formatChangePercent(currentRate: Decimal, previousRate: Decimal) {
  const change = currentRate.minus(previousRate).div(previousRate).mul(100);
  const roundedChange = change.toDecimalPlaces(2);
  const direction = roundedChange.isZero() ? "neutral" : roundedChange.isNegative() ? "down" : "up";
  const sign = direction === "up" ? "+" : "";

  return {
    change: `${sign}${roundedChange.toFixed(2)}%`,
    direction,
  } satisfies Pick<LiveRate, "change" | "direction">;
}

function getBaselineRatesByDate(latestDate: string, historicalRates: FrankfurterRate[]) {
  const baselineDate = historicalRates.reduce<string | null>((earliestDate, rate) => {
    if (rate.date >= latestDate) {
      return earliestDate;
    }

    return earliestDate === null || rate.date < earliestDate ? rate.date : earliestDate;
  }, null);

  return baselineDate ? historicalRates.filter((rate) => rate.date === baselineDate) : [];
}

export function deriveLiveRateForPair({
  base,
  historicalRates,
  latestRates,
  quote,
}: {
  base: string;
  historicalRates: FrankfurterRate[];
  latestRates: FrankfurterRate[];
  quote: string;
}): LiveRate | null {
  const latestRatesByCurrency = getRateByCurrency(latestRates);
  const latestDate = latestRates[0]?.date;
  const baselineRatesByCurrency = latestDate
    ? getRateByCurrency(getBaselineRatesByDate(latestDate, historicalRates))
    : null;

  if (!latestRatesByCurrency || !baselineRatesByCurrency) {
    return null;
  }

  const currentRate = derivePairRate(latestRatesByCurrency, base, quote);
  const baselineRate = derivePairRate(baselineRatesByCurrency, base, quote);

  if (!currentRate || !baselineRate) {
    return null;
  }

  return {
    pair: `${base}/${quote}`,
    rate: formatLiveRate(currentRate),
    ...formatChangePercent(currentRate, baselineRate),
  };
}

export function deriveLiveRates({
  historicalRates,
  latestRates,
}: {
  historicalRates: FrankfurterRate[];
  latestRates: FrankfurterRate[];
}): LiveRate[] {
  return liveRatePairs.flatMap(([base, quote]) => {
    const rate = deriveLiveRateForPair({ base, historicalRates, latestRates, quote });

    return rate ? [rate] : [];
  });
}
