import { getServerConversions } from "@/features/conversion-log/api/server";
import { getServerFavorites } from "@/features/favorites/api/server";
import { ExchangeRateDataStats, getHeaderIsGuest } from "@/features/header/header";
import { UserDropdown } from "@/features/header/user-dropdown";
import { getConverterModel } from "@/features/converter/model/converter";
import { normalizeConverterRates } from "@/features/converter/model/exchange";
import {
  getCurrencyReferenceData,
  getCurrencyReferenceDataForLatestRates,
  getLatestRatesData,
  getLiveRatesData,
} from "@/features/exchange-rates/api/server";
import { Suspense, type ReactNode } from "react";
import { Converter } from "@/features/converter/components/converter";
import { FavoriteButtonFallback } from "@/features/converter/components/converter-amount-controls";
import { ConverterFavoriteButton } from "@/features/converter/components/converter-favorite-button";
import { LiveRateList } from "@/features/live-rates/components/live-rate-list";
import { RateDetails } from "@/features/rate-details";
import { RateDetailsNavigationFallback } from "@/features/rate-details/components/rate-details-fallback";
import { RateDetailsNavigation } from "@/features/rate-details/components/rate-details-navigation";
import { HeaderStatsFallback, LiveRatesFallback } from "./components/home-page-fallback";
import { HomePageContent } from "./components/home-page-content";
import { assertDataAvailable } from "./components/data-unavailable";
import { StaleExchangeRatesAlert } from "./components/stale-exchange-rates-alert";
import { createUrlSearchParams } from "./utils/url-state";

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

async function HeaderStats() {
  const [currencyReferenceData, isGuest] = await Promise.all([
    getCurrencyReferenceData(),
    getHeaderIsGuest(),
  ]);

  assertDataAvailable(currencyReferenceData);

  return (
    <div className="flex items-center gap-200">
      <ExchangeRateDataStats currencyCount={currencyReferenceData.currencyCount} />
      <span aria-hidden="true" className="h-300 w-px shrink-0 bg-neutral-500" />
      <UserDropdown isGuest={isGuest} />
    </div>
  );
}

async function LiveRates() {
  const liveRatesData = await getLiveRatesData();

  assertDataAvailable(liveRatesData);

  return <LiveRateList rates={liveRatesData.liveRates} />;
}

async function ConverterSlot({ searchParams }: { searchParams: HomePageSearchParams }) {
  const latestRatesData = await getLatestRatesData();

  assertDataAvailable(latestRatesData);

  const [params, currencyReferenceData] = await Promise.all([
    searchParams,
    getCurrencyReferenceDataForLatestRates(latestRatesData.rates),
  ]);

  assertDataAvailable(currencyReferenceData);

  const converterRates = normalizeConverterRates(
    latestRatesData.rates,
    currencyReferenceData.availableCurrencies.map((currency) => currency.code)
  );

  return (
    <>
      {latestRatesData.freshness.dataStatus === "stale" ? (
        <StaleExchangeRatesAlert fetchedAt={latestRatesData.freshness.fetchedAt} />
      ) : null}
      <Converter
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
    >
      {children}
    </HomePageContent>
  );
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
        <ConverterSlot searchParams={searchParams} />
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
