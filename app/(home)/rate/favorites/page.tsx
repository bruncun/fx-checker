import type { AvailableCurrency } from "@/features/converter/currencies";
import { FavoriteRates } from "@/features/favorites";
import { getServerFavorites } from "@/features/favorites/server";
import {
  getCurrencyReferenceData,
  getLatestRatesData,
  getLiveRatesData,
} from "@/features/home/home-page";
import { deriveLiveRateForPair } from "@/features/live-rates";
import { RateDetailsRowsFallback } from "@/features/rate-details/components/rate-details-fallback";
import type { FrankfurterRate } from "@/lib/frankfurter";
import { Suspense } from "react";

async function FavoriteRatesContent() {
  const [currencyReferenceData, latestRatesData, liveRatesData] = await Promise.all([
    getCurrencyReferenceData(),
    getLatestRatesData(),
    getLiveRatesData(),
  ]);

  if (currencyReferenceData.status === "unavailable" || latestRatesData.status === "unavailable") {
    return null;
  }

  return (
    <Suspense
      fallback={<RateDetailsRowsFallback label="Favorites" rowCount={8} variant="favorites" />}
    >
      <FavoriteRatesUserContent
        availableCurrencies={currencyReferenceData.availableCurrencies}
        latestRates={latestRatesData.rates}
        liveRateHistoryRates={
          liveRatesData.status === "available" ? liveRatesData.liveRateHistoryRates : []
        }
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
  const favorites = await getServerFavorites().catch(() => []);
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
      liveRates={favoriteRates}
    />
  );
}

export default function FavoriteRatesPage() {
  return (
    <Suspense
      fallback={<RateDetailsRowsFallback label="Favorites" rowCount={8} variant="favorites" />}
    >
      <FavoriteRatesContent />
    </Suspense>
  );
}
