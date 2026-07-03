import { CompareRates } from "@/features/compare-rates";
import { getCurrencyReferenceData, getLatestRatesData } from "@/features/home/home-page";
import {
  getConverterAmountFromParams,
  getSelectedCurrencyPairFromParams,
} from "@/features/home/url-state";
import { getServerFavorites } from "@/features/favorites/server";
import { Suspense } from "react";

type CompareRatesPageProps = {
  searchParams: Promise<{
    amount?: string;
    amountSource?: string;
    from?: string;
    to?: string;
  }>;
};

async function CompareRatesContent({ searchParams }: CompareRatesPageProps) {
  const [params, currencyReferenceData, latestRatesData, favorites] = await Promise.all([
    searchParams,
    getCurrencyReferenceData(),
    getLatestRatesData(),
    getServerFavorites().catch(() => []),
  ]);

  if (currencyReferenceData.status === "unavailable" || latestRatesData.status === "unavailable") {
    return null;
  }

  const urlSearchParams = new URLSearchParams(params);
  const selectedCurrencies = getSelectedCurrencyPairFromParams(
    currencyReferenceData.availableCurrencies,
    urlSearchParams
  );
  const converterAmount = getConverterAmountFromParams(urlSearchParams);

  return (
    <CompareRates
      {...converterAmount}
      {...selectedCurrencies}
      availableCurrencies={currencyReferenceData.availableCurrencies}
      favorites={favorites}
      rates={latestRatesData.rates}
    />
  );
}

export default function CompareRatesPage({ searchParams }: CompareRatesPageProps) {
  return (
    <Suspense fallback={<section aria-label="Rate details" />}>
      <CompareRatesContent searchParams={searchParams} />
    </Suspense>
  );
}
