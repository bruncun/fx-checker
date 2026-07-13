import type { AvailableCurrency } from "@/features/converter/model/currencies";
import {
  getCurrencyReferenceDataForLatestRates,
  getLatestRatesData,
  getLiveRatesDataForLatestRates,
} from "@/features/exchange-rates/api/server";
import { FavoriteRates, FavoriteRatesFallback } from "@/features/favorites";
import { getServerFavorites } from "@/features/favorites/api/server";
import { assertDataAvailable } from "@/features/home/components/data-unavailable";
import { deriveLiveRateForPair } from "@/features/live-rates";
import type { FrankfurterRate } from "@/lib/frankfurter";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Dashboard - Favorite Rates",
};

async function FavoriteRatesContent() {
  const latestRatesData = await getLatestRatesData();

  assertDataAvailable(latestRatesData);

  const [currencyReferenceData, liveRatesData] = await Promise.all([
    getCurrencyReferenceDataForLatestRates(latestRatesData.rates),
    getLiveRatesDataForLatestRates(latestRatesData.rates),
  ]);

  assertDataAvailable(currencyReferenceData);
  assertDataAvailable(liveRatesData);

  return (
    <Suspense fallback={<FavoriteRatesFallback />}>
      <FavoriteRatesUserContent
        availableCurrencies={currencyReferenceData.availableCurrencies}
        latestRates={latestRatesData.rates}
        liveRateHistoryRates={liveRatesData.liveRateHistoryRates}
      />
    </Suspense>
  );
}

async function FavoriteRatesUserContent({
  availableCurrencies,
  latestRates,
  liveRateHistoryRates,
}: {
  availableCurrencies: AvailableCurrency[];
  latestRates: FrankfurterRate[];
  liveRateHistoryRates: FrankfurterRate[];
}) {
  const favorites = await getServerFavorites();
  const favoriteRates = favorites.flatMap((favorite) => {
    const rate = deriveLiveRateForPair({
      base: favorite.fromCurrency,
      historicalRates: liveRateHistoryRates,
      latestRates,
      quote: favorite.toCurrency,
    });

    return rate ? [rate] : [];
  });

  return (
    <FavoriteRates
      availableCurrencies={availableCurrencies}
      favorites={favorites}
      latestRates={latestRates}
      liveRates={favoriteRates}
      liveRateHistoryRates={liveRateHistoryRates}
    />
  );
}

export default function FavoriteRatesPage() {
  return (
    <Suspense fallback={<FavoriteRatesFallback />}>
      <FavoriteRatesContent />
    </Suspense>
  );
}
