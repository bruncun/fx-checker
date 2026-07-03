import { FavoriteRates } from "@/features/favorites";
import { getServerFavorites } from "@/features/favorites/server";
import {
  getCurrencyReferenceData,
  getLatestRatesData,
  getLiveRatesData,
} from "@/features/home/home-page";
import { deriveLiveRateForPair } from "@/features/live-rates";
import { Suspense } from "react";

async function FavoriteRatesContent() {
  const [currencyReferenceData, latestRatesData, liveRatesData, favorites] = await Promise.all([
    getCurrencyReferenceData(),
    getLatestRatesData(),
    getLiveRatesData(),
    getServerFavorites().catch(() => []),
  ]);

  if (currencyReferenceData.status === "unavailable" || latestRatesData.status === "unavailable") {
    return null;
  }

  const favoriteRates = favorites.flatMap((favorite) => {
    const rate = deriveLiveRateForPair({
      base: favorite.fromCurrency,
      historicalRates:
        liveRatesData.status === "available" ? liveRatesData.liveRateHistoryRates : [],
      latestRates: latestRatesData.rates,
      quote: favorite.toCurrency,
    });

    return rate ? [rate] : [];
  });

  return (
    <FavoriteRates
      availableCurrencies={currencyReferenceData.availableCurrencies}
      favorites={favorites}
      liveRates={favoriteRates}
    />
  );
}

export default function FavoriteRatesPage() {
  return (
    <Suspense fallback={<section aria-label="Rate details" />}>
      <FavoriteRatesContent />
    </Suspense>
  );
}
