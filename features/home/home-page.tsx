import { getServerConversions } from "@/features/conversion-log/api/server";
import { getServerFavorites } from "@/features/favorites/api/server";
import { AccountFallback, ExchangeRateDataStats, getHeaderAccount } from "@/features/header/header";
import { UserDropdown } from "@/features/header/user-dropdown";
import type { AvailableCurrency } from "@/features/converter/model/currencies";
import {
  getCurrencyReferenceData,
  getCurrencyReferenceDataForLatestRates,
  getLatestRatesData,
  getLiveRatesData,
} from "@/features/exchange-rates/api/server";
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
import { connection } from "next/server";

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
  await connection();

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
  const latestRatesData = await getLatestRatesData();

  assertDataAvailable(latestRatesData);
  const currencyReferencePromise = getConverterCurrencyReference(latestRatesData.rates);

  return (
    <>
      {latestRatesData.freshness.dataStatus === "stale" ? (
        <StaleExchangeRatesAlert fetchedAt={latestRatesData.freshness.fetchedAt} />
      ) : null}
      <Suspense fallback={<ConverterFallback />}>
        <Converter
          currencyReferencePromise={currencyReferencePromise}
          favoritesPromise={favoritesPromise}
          rates={latestRatesData.rates}
        />
      </Suspense>
    </>
  );
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
      converterSlot={
        <Suspense fallback={<ConverterFallback />}>
          <ConverterSlot />
        </Suspense>
      }
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
