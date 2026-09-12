import { getServerConversions } from "@/features/conversion-log/api/server";
import { getServerFavorites } from "@/features/favorites/api/server";
import { ExchangeRateDataStats, getHeaderIsGuest } from "@/features/header/header";
import { UserDropdown } from "@/features/header/user-dropdown";
import type { AvailableCurrency } from "@/features/converter/model/currencies";
import { getCurrencyFlagCountryCode } from "@/features/converter/model/currencies";
import { getConverterModel } from "@/features/converter/model/converter";
import {
  getCurrencyReferenceDataForLatestRates,
  getLatestRatesData,
  getPrerenderedLatestRatesData,
  getPrerenderedLiveRatesData,
} from "@/features/exchange-rates/api/server";
import { Suspense, type ReactNode } from "react";
import { io } from "next/cache";
import { Converter } from "@/features/converter/components/converter";
import { FavoriteButtonFallback } from "@/features/converter/components/converter-amount-controls";
import { ConverterFavoriteButton } from "@/features/converter/components/converter-favorite-button";
import { LiveRateList } from "@/features/live-rates/components/live-rate-list";
import { RateDetails } from "@/features/rate-details";
import { RateDetailsNavigationFallback } from "@/features/rate-details/components/rate-details-fallback";
import { RateDetailsNavigation } from "@/features/rate-details/components/rate-details-navigation";
import {
  ConverterFallback,
  HeaderCurrencyStatsFallback,
  LiveRatesFallback,
} from "./components/home-page-fallback";
import { HomePageContent } from "./components/home-page-content";
import { assertDataAvailable } from "./components/data-unavailable";
import { StaleExchangeRatesAlert } from "./components/stale-exchange-rates-alert";
import { createUrlSearchParams } from "./utils/url-state";
import { getInitialConverterRates } from "./utils/converter-rates";

type HomePageShellProps = {
  children: ReactNode;
};

type HomePageSearchParams = Promise<{
  amount?: string;
  amountSource?: string;
  from?: string;
  range?: string;
  receiveAmount?: string;
  to?: string;
}>;

type HomePageRouteContentProps = {
  children: ReactNode;
  searchParams: HomePageSearchParams;
};

type ConverterData = {
  latestRatesData: Extract<Awaited<ReturnType<typeof getLatestRatesData>>, { status: "available" }>;
  params: Awaited<HomePageSearchParams>;
  rates: ReturnType<typeof getInitialConverterRates>;
};

async function HeaderCurrencyStats() {
  // Keep snapshot reads out of the static shell, even when the data cache is cold.
  await io();

  const latestRatesData = await getPrerenderedLatestRatesData();

  assertDataAvailable(latestRatesData);

  const currencyCount = new Set(
    latestRatesData.rates.flatMap(({ base, quote }) =>
      [base, quote].filter((currency) => getCurrencyFlagCountryCode(currency) !== undefined)
    )
  ).size;

  return <ExchangeRateDataStats currencyCount={currencyCount} />;
}

async function HeaderUserDropdown() {
  return <UserDropdown isGuest={await getHeaderIsGuest()} />;
}

function HeaderStats() {
  return (
    <div className="flex items-center gap-200">
      <Suspense fallback={<HeaderCurrencyStatsFallback />}>
        <HeaderCurrencyStats />
      </Suspense>
      <span aria-hidden="true" className="h-300 w-px shrink-0 bg-neutral-500" />
      <Suspense fallback={<UserDropdown isGuest />}>
        <HeaderUserDropdown />
      </Suspense>
    </div>
  );
}

async function LiveRates() {
  // Keep snapshot reads out of the static shell, even when the data cache is cold.
  await io();

  const liveRatesData = await getPrerenderedLiveRatesData();

  return liveRatesData.status === "available" ? (
    <LiveRateList rates={liveRatesData.liveRates} />
  ) : (
    <LiveRatesFallback />
  );
}

async function getConverterData(searchParams: HomePageSearchParams): Promise<ConverterData> {
  const [latestRatesData, params] = await Promise.all([getLatestRatesData(), searchParams]);

  assertDataAvailable(latestRatesData);

  return {
    latestRatesData,
    params,
    rates: getInitialConverterRates(latestRatesData.rates),
  };
}

function ConverterSlot({ converterData }: { converterData: ConverterData }) {
  const { latestRatesData, params, rates: converterRates } = converterData;
  const currencyReferencePromise = getConverterCurrencyReference(latestRatesData.rates);

  return (
    <>
      {latestRatesData.freshness.dataStatus === "stale" ? (
        <StaleExchangeRatesAlert fetchedAt={latestRatesData.freshness.fetchedAt} />
      ) : null}
      <Converter
        currencyReferencePromise={currencyReferencePromise}
        favoriteButtonSlot={
          <Suspense fallback={<FavoriteButtonFallback />}>
            <ConverterFavoriteButtonSlot />
          </Suspense>
        }
        initialConverterModel={getConverterModel({
          rates: converterRates,
          searchParams: createUrlSearchParams(params),
        })}
        rates={converterRates}
      />
    </>
  );
}

function ConverterFavoriteButtonSlot() {
  return <ConverterFavoriteButton favoritesPromise={getServerFavorites()} />;
}

async function getConverterCurrencyReference(
  latestRates: Parameters<typeof getCurrencyReferenceDataForLatestRates>[0]
): Promise<AvailableCurrency[]> {
  const currencyReferenceData = await getCurrencyReferenceDataForLatestRates(latestRates);

  assertDataAvailable(currencyReferenceData);

  return currencyReferenceData.availableCurrencies;
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
      headerStatsSlot={<HeaderStats />}
      liveRatesSlot={
        <Suspense fallback={<LiveRatesFallback />}>
          <LiveRates />
        </Suspense>
      }
    >
      {children}
    </HomePageContent>
  );
}

async function ConverterContent({ searchParams }: { searchParams: HomePageSearchParams }) {
  await io();
  const converterData = await getConverterData(searchParams);

  return <ConverterSlot converterData={converterData} />;
}

export function HomePageRouteContent({ children, searchParams }: HomePageRouteContentProps) {
  return (
    <>
      <section
        aria-label="Converter"
        className="relative z-[30] scroll-mt-200 focus:outline-none"
        id="converter"
        tabIndex={-1}
      >
        <h1 id="converter-heading" className="mb-200 text-preset-2 text-neutral-50 uppercase">
          Check the Rate
        </h1>
        <Suspense fallback={<ConverterFallback />}>
          <ConverterContent searchParams={searchParams} />
        </Suspense>
      </section>
      <div className="mt-500 lg:mt-400">
        <RateDetails
          navigationSlot={
            <Suspense fallback={<RateDetailsNavigationFallback />}>
              <RateDetailsNavigationSlot />
            </Suspense>
          }
        >
          {children}
        </RateDetails>
      </div>
    </>
  );
}

export type { HomePageSearchParams };
