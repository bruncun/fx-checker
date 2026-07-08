import type { AvailableCurrency } from "@/features/converter/currencies";
import { FavoriteRates } from "@/features/favorites";
import { getServerFavorites } from "@/features/favorites/server";
import { assertDataAvailable } from "@/features/home/components/data-unavailable";
import {
  getCurrencyReferenceData,
  getLatestRatesData,
  getLiveRatesData,
} from "@/features/home/home-page";
import { deriveLiveRateForPair } from "@/features/live-rates";
import type { FrankfurterRate } from "@/lib/frankfurter";
import { Suspense } from "react";

async function FavoriteRatesContent() {
  const [currencyReferenceData, latestRatesData, liveRatesData] = await Promise.all([
    getCurrencyReferenceData(),
    getLatestRatesData(),
    getLiveRatesData(),
  ]);

  assertDataAvailable(currencyReferenceData);
  assertDataAvailable(latestRatesData);
  assertDataAvailable(liveRatesData);

  return (
    <Suspense fallback={null}>
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
    <Suspense fallback={null}>
      <FavoriteRatesContent />
    </Suspense>
  );
}
