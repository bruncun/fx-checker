import { CompareRates } from "@/features/compare-rates";
import { getCurrencyReferenceData, getLatestRatesData } from "@/features/home/home-page";
import {
  getConverterAmountFromParams,
  getSelectedCurrencyPairFromParams,
} from "@/features/home/url-state";
import { getServerFavorites } from "@/features/favorites/server";
import { RateDetailsRowsFallback } from "@/features/rate-details/components/rate-details-fallback";
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
  const params = await searchParams;
  const favoritesPromise = getServerFavorites().catch(() => []);
  const [currencyReferenceData, latestRatesData] = await Promise.all([
    getCurrencyReferenceData(),
    getLatestRatesData(),
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
      favoritesPromise={favoritesPromise}
      rates={latestRatesData.rates}
    />
  );
}

export default function CompareRatesPage({ searchParams }: CompareRatesPageProps) {
  return (
    <Suspense fallback={<RateDetailsRowsFallback label="Compare" rowCount={8} variant="compare" />}>
      <CompareRatesContent searchParams={searchParams} />
    </Suspense>
  );
}
