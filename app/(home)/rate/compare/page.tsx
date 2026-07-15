import { CompareRates, CompareRatesFallback } from "@/features/compare-rates/components/compare-rates";
import type { AvailableCurrency } from "@/features/converter/model/currencies";
import {
  getCurrencyReferenceDataForLatestRates,
  getLatestRatesData,
} from "@/features/exchange-rates/api/server";
import { assertDataAvailable } from "@/features/home/components/data-unavailable";
import {
  getConverterAmountFromParams,
  getSelectedCurrencyPairFromParams,
} from "@/features/home/utils/url-state";
import { getServerFavorites } from "@/features/favorites/api/server";
import { getCompareRatesModel } from "@/features/compare-rates/model/compare-rates";
import type { FrankfurterRate } from "@/lib/frankfurter";
import type { Metadata } from "next";
import { Suspense } from "react";

type CompareRatesPageProps = {
  searchParams: Promise<{
    amount?: string;
    amountSource?: string;
    from?: string;
    to?: string;
  }>;
};

export const metadata: Metadata = {
  title: "Dashboard - Compare Rates",
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
  const compareRatesModel = getCompareRatesModel({
    ...converterAmount,
    ...selectedCurrencies,
    availableCurrencies,
    rates: latestRates,
  });

  return (
    <CompareRates
      {...converterAmount}
      {...selectedCurrencies}
      availableCurrencies={availableCurrencies}
      favoritesPromise={favoritesPromise}
      initialCompareRates={compareRatesModel.compareRates}
      initialSendAmount={compareRatesModel.sendAmount}
      rates={latestRates}
    />
  );
}

async function CompareRatesShell({ searchParams }: CompareRatesPageProps) {
  const latestRatesData = await getLatestRatesData();

  assertDataAvailable(latestRatesData);

  const currencyReferenceData = await getCurrencyReferenceDataForLatestRates(latestRatesData.rates);

  assertDataAvailable(currencyReferenceData);

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
