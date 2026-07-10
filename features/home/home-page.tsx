import { deriveAvailableCurrencies, type AvailableCurrency } from "@/features/converter/currencies";
import { getServerConversions } from "@/features/conversion-log/server";
import { getServerFavorites } from "@/features/favorites/server";
import { AccountFallback, ExchangeRateDataStats, getHeaderAccount } from "@/features/header/header";
import { UserDropdown } from "@/features/header/user-dropdown";
import { deriveLiveRates, type LiveRate } from "@/features/live-rates";
import {
  getDateYearsBefore,
  getRateHistoryRangeStartDate,
  type HistoryRange,
} from "@/features/rate-history/rate-history";
import { getCurrencies, getRates, type FrankfurterRate } from "@/lib/frankfurter";
import {
  getLatestExchangeRateSnapshot,
  saveLatestExchangeRateSnapshot,
} from "@/lib/latest-exchange-rate-snapshot";
import { cacheLife } from "next/cache";
import { Suspense, type ReactNode } from "react";
import { Converter } from "@/features/converter";
import { LiveRateList } from "@/features/live-rates";
import { RateDetails } from "@/features/rate-details";
import { RateDetailsNavigationFallback } from "@/features/rate-details/components/rate-details-fallback";
import { RateDetailsNavigation } from "@/features/rate-details/components/rate-details-navigation";
import {
  ConverterFallback,
  HeaderStatsFallback,
  LiveRatesFallback,
} from "./components/home-page-fallback";
import { HomePageContent } from "./components/home-page-content";
import { assertDataAvailable } from "./components/data-unavailable";
import { StaleExchangeRatesAlert } from "./components/stale-exchange-rates-alert";

const RATE_HISTORY_YEARS = 5;
const LIVE_RATE_LOOKBACK_DAYS = 7;

type DateRange = {
  from: string;
  to: string;
};

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

function subtractDays(date: Date, days: number) {
  const previousDate = new Date(date);

  previousDate.setUTCDate(previousDate.getUTCDate() - days);

  return previousDate;
}

function getDateDaysBefore(date: string, days: number) {
  const targetDate = parseIsoDate(date);

  return targetDate ? formatIsoDate(subtractDays(targetDate, days)) : null;
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

  const rates = await getRates();

  if (rates.length === 0) {
    return { status: "unavailable" };
  }

  const fetchedAt = new Date().toISOString();

  try {
    await saveLatestExchangeRateSnapshot(rates, fetchedAt);
  } catch (error) {
    console.error("Failed to persist latest exchange rate snapshot", {
      cause: error instanceof Error ? error.message : String(error),
    });
  }

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
  "use cache";
  cacheLife("days");

  try {
    const [currencies, latestRatesData] = await Promise.all([
      getCurrencies(),
      getLatestRatesData(),
    ]);

    if (latestRatesData.status === "unavailable") {
      return { status: "unavailable" };
    }

    const availableCurrencies = deriveAvailableCurrencies(currencies, latestRatesData.rates);

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
  "use cache";
  cacheLife("days");

  try {
    const latestRatesData = await getLatestRatesData();

    if (latestRatesData.status === "unavailable") {
      return { status: "unavailable" };
    }

    const latestDate = latestRatesData.rates[0]?.date;
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
      latestRates: latestRatesData.rates,
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

export async function getHistoryPageData({
  baseCurrency,
  quoteCurrency,
  range,
}: {
  baseCurrency: string;
  quoteCurrency: string;
  range: HistoryRange;
}): Promise<HistoryPageData> {
  "use cache";
  cacheLife("days");

  try {
    const latestRatesData = await getLatestRatesData();

    if (latestRatesData.status === "unavailable") {
      return { status: "unavailable" };
    }

    const latestRate = latestRatesData.rates[0];
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

type HomePageShellProps = {
  children: ReactNode;
};

async function HeaderStats() {
  const currencyReferenceData = await getCurrencyReferenceData();

  assertDataAvailable(currencyReferenceData);

  return (
    <div className="flex items-center gap-200">
      <ExchangeRateDataStats currencyCount={currencyReferenceData.currencyCount} />
      <Suspense fallback={<AccountFallback />}>
        <HeaderAccount />
      </Suspense>
    </div>
  );
}

async function HeaderAccount() {
  const account = await getHeaderAccount();

  return <UserDropdown email={account.email} isGuest={account.isGuest} />;
}

async function LiveRates() {
  const liveRatesData = await getLiveRatesData();

  assertDataAvailable(liveRatesData);

  return <LiveRateList rates={liveRatesData.liveRates} />;
}

async function ConverterSlot() {
  const favoritesPromise = getServerFavorites();
  const [currencyReferenceData, latestRatesData] = await Promise.all([
    getCurrencyReferenceData(),
    getLatestRatesData(),
  ]);

  assertDataAvailable(currencyReferenceData);
  assertDataAvailable(latestRatesData);

  return (
    <>
      {latestRatesData.freshness.dataStatus === "stale" ? (
        <StaleExchangeRatesAlert fetchedAt={latestRatesData.freshness.fetchedAt} />
      ) : null}
      <Suspense fallback={<ConverterFallback />}>
        <Converter
          currencies={currencyReferenceData.availableCurrencies}
          favoritesPromise={favoritesPromise}
          rates={latestRatesData.rates}
        />
      </Suspense>
    </>
  );
}

async function RateDetailsNavigationSlot() {
  const [favorites, conversions] = await Promise.all([
    getServerFavorites(),
    getServerConversions(),
  ]);

  return (
    <RateDetailsNavigation conversionCount={conversions.length} favoriteCount={favorites.length} />
  );
}

export function HomePageShell({ children }: HomePageShellProps) {
  return (
    <HomePageContent
      converterSlot={<ConverterSlot />}
      headerStatsSlot={
        <Suspense fallback={<HeaderStatsFallback />}>
          <HeaderStats />
        </Suspense>
      }
      liveRatesSlot={
        <Suspense fallback={<LiveRatesFallback />}>
          <LiveRates />
        </Suspense>
      }
      rateDetailsSlot={
        <RateDetails
          navigationSlot={
            <Suspense fallback={<RateDetailsNavigationFallback />}>
              <RateDetailsNavigationSlot />
            </Suspense>
          }
        >
          {children}
        </RateDetails>
      }
    />
  );
}
