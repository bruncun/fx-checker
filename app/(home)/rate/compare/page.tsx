import { CompareRates, CompareRatesFallback } from "@/features/compare-rates";
import type { AvailableCurrency } from "@/features/converter/currencies";
import { getCurrencyReferenceData, getLatestRatesData } from "@/features/exchange-rates/server";
import { assertDataAvailable } from "@/features/home/components/data-unavailable";
import {
  getConverterAmountFromParams,
  getSelectedCurrencyPairFromParams,
} from "@/features/home/url-state";
import { getServerFavorites } from "@/features/favorites/server";
import type { FrankfurterRate } from "@/lib/frankfurter";
import { Suspense } from "react";

type CompareRatesPageProps = {
  searchParams: Promise<{
    amount?: string;
    amountSource?: string;
    from?: string;
    to?: string;
  }>;
};

async function CompareRatesContent({
  availableCurrencies,
  latestRates,
  searchParams,
}: CompareRatesPageProps & {
  availableCurrencies: AvailableCurrency[];
  latestRates: FrankfurterRate[];
}) {
  const params = await searchParams;
  const favoritesPromise = getServerFavorites();
  const urlSearchParams = new URLSearchParams(params);
  const selectedCurrencies = getSelectedCurrencyPairFromParams(
    availableCurrencies,
    urlSearchParams
  );
  const converterAmount = getConverterAmountFromParams(urlSearchParams);

  return (
    <CompareRates
      {...converterAmount}
      {...selectedCurrencies}
      availableCurrencies={availableCurrencies}
      favoritesPromise={favoritesPromise}
      rates={latestRates}
    />
  );
}

async function CompareRatesShell({ searchParams }: CompareRatesPageProps) {
  const [currencyReferenceData, latestRatesData] = await Promise.all([
    getCurrencyReferenceData(),
    getLatestRatesData(),
  ]);

  assertDataAvailable(currencyReferenceData);
  assertDataAvailable(latestRatesData);

  return (
    <Suspense fallback={<CompareRatesFallback />}>
      <CompareRatesContent
        availableCurrencies={currencyReferenceData.availableCurrencies}
        latestRates={latestRatesData.rates}
        searchParams={searchParams}
      />
    </Suspense>
  );
}

export default function CompareRatesPage({ searchParams }: CompareRatesPageProps) {
  return (
    <Suspense fallback={<CompareRatesFallback />}>
      <CompareRatesShell searchParams={searchParams} />
    </Suspense>
  );
}
