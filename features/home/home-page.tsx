import { deriveAvailableCurrencies, type AvailableCurrency } from "@/features/converter/currencies";
import { getServerFavorites } from "@/features/favorites/server";
import { deriveLiveRates, type LiveRate } from "@/features/live-rates";
import { getDateYearsBefore } from "@/features/rate-history/rate-history";
import { getCurrencies, getRates, type FrankfurterRate } from "@/lib/frankfurter";
import { cache, type ReactNode } from "react";
import { HomePageContent } from "./components/home-page-content";

const RATE_HISTORY_YEARS = 5;

type DateRange = {
  from: string;
  to: string;
};

export type HomePageData =
  | {
      status: "available";
      availableCurrencies: AvailableCurrency[];
      currencyCount: number;
      historicalRates: FrankfurterRate[];
      liveRates: LiveRate[];
      rates: FrankfurterRate[];
    }
  | { status: "unavailable" };

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

async function getHistoricalRatesByYear({ from, to }: DateRange) {
  const ranges = getYearlyDateRanges({ from, to, years: RATE_HISTORY_YEARS });
  const rateGroups = await Promise.all(ranges.map((range) => getRates(range)));

  return rateGroups.flat();
}

export const getHomePageData = cache(async (): Promise<HomePageData> => {
  try {
    const [currencies, rates] = await Promise.all([getCurrencies(), getRates()]);
    const latestDate = rates[0]?.date;
    const historyStartDate = latestDate ? getDateYearsBefore(latestDate, RATE_HISTORY_YEARS) : null;

    if (!latestDate || !historyStartDate) {
      return { status: "unavailable" };
    }

    const historicalRates = await getHistoricalRatesByYear({
      from: historyStartDate,
      to: latestDate,
    });
    const availableCurrencies = deriveAvailableCurrencies(currencies, rates);

    if (availableCurrencies.length < 2) {
      return { status: "unavailable" };
    }

    const liveRates = deriveLiveRates({
      historicalRates: [...historicalRates, ...rates],
      latestRates: rates,
    });

    return {
      status: "available",
      availableCurrencies,
      currencyCount: availableCurrencies.length,
      historicalRates,
      liveRates,
      rates,
    };
  } catch {
    return { status: "unavailable" };
  }
});

function DataUnavailable() {
  return (
    <main className="text-white min-h-screen bg-neutral-900">
      <section className="mx-auto flex min-h-[calc(100vh-88px)] max-w-[520px] flex-col items-center justify-center px-300 text-center">
        <h1 className="text-preset-2">Exchange rate data is unavailable</h1>
        <p className="mt-150 text-preset-4 text-neutral-200">
          We could not load the latest currency data. Please refresh the page in a moment.
        </p>
      </section>
    </main>
  );
}

type HomePageShellProps = {
  children: ReactNode;
};

export async function HomePageShell({ children }: HomePageShellProps) {
  const [data, favorites] = await Promise.all([
    getHomePageData(),
    getServerFavorites().catch((error) => {
      console.error("Failed to retrieve favorites", error);

      return [];
    }),
  ]);

  if (data.status === "unavailable") {
    return <DataUnavailable />;
  }

  return (
    <HomePageContent
      availableCurrencies={data.availableCurrencies}
      currencyCount={data.currencyCount}
      favorites={favorites}
      liveRates={data.liveRates}
      rates={data.rates}
    >
      {children}
    </HomePageContent>
  );
}
