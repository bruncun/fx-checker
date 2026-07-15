import type { AvailableCurrency } from "@/features/converter/model/currencies";
import type { SelectedCurrency } from "@/features/converter/model/selected-currency";
import { deriveLiveRateForPair, type LiveRate } from "@/features/live-rates";
import type { FrankfurterRate } from "@/lib/frankfurter";
import type { Favorite } from "./favorites";

export type FavoriteRateItemData = {
  favorite: Favorite;
  fromCurrency: AvailableCurrency;
  rate: LiveRate;
  toCurrency: AvailableCurrency;
};

export function toSelectedCurrency(currency: AvailableCurrency): SelectedCurrency {
  return {
    countryCode: currency.countryCode,
    currencyCode: currency.code,
  };
}

export function getAvailableCurrencyByCode(availableCurrencies: AvailableCurrency[]) {
  return new Map(availableCurrencies.map((currency) => [currency.code, currency]));
}

export function getLiveRateByPair(liveRates: LiveRate[]) {
  return new Map(liveRates.map((liveRate) => [liveRate.pair, liveRate]));
}

export function getFavoriteRateRow({
  currencyByCode,
  favorite,
  latestRates,
  liveRateByPair,
  liveRateHistoryRates,
}: {
  currencyByCode: Map<string, AvailableCurrency>;
  favorite: Favorite;
  latestRates: FrankfurterRate[];
  liveRateByPair: Map<string, LiveRate>;
  liveRateHistoryRates: FrankfurterRate[];
}): FavoriteRateItemData | null {
  const fromCurrency = currencyByCode.get(favorite.fromCurrency);
  const toCurrency = currencyByCode.get(favorite.toCurrency);

  if (!fromCurrency || !toCurrency) {
    return null;
  }

  const rate =
    liveRateByPair.get(`${favorite.fromCurrency}/${favorite.toCurrency}`) ??
    deriveLiveRateForPair({
      base: favorite.fromCurrency,
      historicalRates: liveRateHistoryRates,
      latestRates,
      quote: favorite.toCurrency,
    });

  return rate ? { favorite, fromCurrency, rate, toCurrency } : null;
}

export function getFavoriteRateRows({
  availableCurrencies,
  favorites,
  latestRates,
  liveRates,
  liveRateHistoryRates,
}: {
  availableCurrencies: AvailableCurrency[];
  favorites: Favorite[];
  latestRates: FrankfurterRate[];
  liveRates: LiveRate[];
  liveRateHistoryRates: FrankfurterRate[];
}) {
  const currencyByCode = getAvailableCurrencyByCode(availableCurrencies);
  const liveRateByPair = getLiveRateByPair(liveRates);

  return favorites.flatMap((favorite) => {
    const row = getFavoriteRateRow({
      currencyByCode,
      favorite,
      latestRates,
      liveRateByPair,
      liveRateHistoryRates,
    });

    return row ? [row] : [];
  });
}
