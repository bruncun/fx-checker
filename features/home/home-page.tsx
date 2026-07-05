import { deriveAvailableCurrencies, type AvailableCurrency } from "@/features/converter/currencies";
import { convertAmount, formatExchangeRate, getExchangeRate } from "@/features/converter/exchange";
import { getServerConversions } from "@/features/conversion-log/server";
import { getServerFavorites } from "@/features/favorites/server";
import { ExchangeRateStats } from "@/features/header/header";
import { deriveLiveRates, type LiveRate } from "@/features/live-rates";
import { getDateYearsBefore } from "@/features/rate-history/rate-history";
import { getCurrencies, getRates, type FrankfurterRate } from "@/lib/frankfurter";
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
import { getConverterAmountFromParams, getDefaultCurrencyPair } from "./url-state";

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

export type CurrencyReferenceData = DataResult<{
  availableCurrencies: AvailableCurrency[];
  currencyCount: number;
}>;

export type LatestRatesData = DataResult<{
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

async function getHistoricalRatesByYear({ from, to }: DateRange) {
  const ranges = getYearlyDateRanges({ from, to, years: RATE_HISTORY_YEARS });
  const rateGroups = await Promise.all(ranges.map((range) => getRates(range)));

  return rateGroups.flat();
}

export async function getLatestRatesData(): Promise<LatestRatesData> {
  "use cache";
  cacheLife("days");

  try {
    const rates = await getRates();

    return rates.length > 0 ? { status: "available", rates } : { status: "unavailable" };
  } catch {
    return { status: "unavailable" };
  }
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

export async function getHistoryPageData(): Promise<HistoryPageData> {
  "use cache";
  cacheLife("days");

  try {
    const latestRatesData = await getLatestRatesData();

    if (latestRatesData.status === "unavailable") {
      return { status: "unavailable" };
    }

    const latestDate = latestRatesData.rates[0]?.date;
    const historyStartDate = latestDate ? getDateYearsBefore(latestDate, RATE_HISTORY_YEARS) : null;

    if (!latestDate || !historyStartDate) {
      return { status: "unavailable" };
    }

    const historicalRates = await getHistoricalRatesByYear({
      from: historyStartDate,
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

  if (currencyReferenceData.status === "unavailable") {
    return null;
  }

  return <ExchangeRateStats currencyCount={currencyReferenceData.currencyCount} />;
}

async function LiveRates() {
  const liveRatesData = await getLiveRatesData();

  if (liveRatesData.status === "unavailable") {
    return null;
  }

  return <LiveRateList rates={liveRatesData.liveRates} />;
}

async function ConverterSlot() {
  const favoritesPromise = getServerFavorites().catch(() => []);
  const [currencyReferenceData, latestRatesData] = await Promise.all([
    getCurrencyReferenceData(),
    getLatestRatesData(),
  ]);

  if (currencyReferenceData.status === "unavailable" || latestRatesData.status === "unavailable") {
    return null;
  }

  const selectedCurrencies = getDefaultCurrencyPair(currencyReferenceData.availableCurrencies);
  const defaultAmount = getConverterAmountFromParams(new URLSearchParams());
  const exchangeRate = getExchangeRate(
    latestRatesData.rates,
    selectedCurrencies.sendCurrency.currencyCode,
    selectedCurrencies.receiveCurrency.currencyCode
  );
  const inverseExchangeRate =
    exchangeRate === null
      ? null
      : getExchangeRate(
          latestRatesData.rates,
          selectedCurrencies.receiveCurrency.currencyCode,
          selectedCurrencies.sendCurrency.currencyCode
        );
  const receiveAmount =
    defaultAmount.amountSource === "receive"
      ? defaultAmount.amount
      : convertAmount(defaultAmount.amount, exchangeRate);
  const sendAmount =
    defaultAmount.amountSource === "send"
      ? defaultAmount.amount
      : convertAmount(defaultAmount.amount, inverseExchangeRate);
  const exchangeRateLabel =
    exchangeRate === null
      ? `Rate unavailable for ${selectedCurrencies.sendCurrency.currencyCode}/${selectedCurrencies.receiveCurrency.currencyCode}`
      : `1 ${selectedCurrencies.sendCurrency.currencyCode} = ${formatExchangeRate(exchangeRate)} ${selectedCurrencies.receiveCurrency.currencyCode}`;

  return (
    <Suspense
      fallback={
        <ConverterFallback
          exchangeRateLabel={exchangeRateLabel}
          receiveAmount={receiveAmount}
          receiveCurrency={selectedCurrencies.receiveCurrency}
          sendAmount={sendAmount}
          sendCurrency={selectedCurrencies.sendCurrency}
        />
      }
    >
      <Converter
        currencies={currencyReferenceData.availableCurrencies}
        favoritesPromise={favoritesPromise}
        rates={latestRatesData.rates}
      />
    </Suspense>
  );
}

async function RateDetailsNavigationSlot() {
  const [favorites, conversions] = await Promise.all([
    getServerFavorites().catch(() => []),
    getServerConversions().catch(() => []),
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
