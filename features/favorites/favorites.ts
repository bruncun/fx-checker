export type FavoriteCurrencyPair = {
  fromCurrency: string;
  toCurrency: string;
};

export type Favorite = FavoriteCurrencyPair & {
  createdAt: string;
  id: string;
};

export type FavoriteRow = {
  created_at: string;
  from_currency: string;
  id: string;
  to_currency: string;
};

export function mapFavorite(row: FavoriteRow): Favorite {
  return {
    createdAt: row.created_at,
    fromCurrency: row.from_currency,
    id: row.id,
    toCurrency: row.to_currency,
  };
}

function normalizeCurrencyCode(code: string) {
  return code.trim().toUpperCase();
}

export function normalizeFavoritePair(pair: FavoriteCurrencyPair): FavoriteCurrencyPair {
  return {
    fromCurrency: normalizeCurrencyCode(pair.fromCurrency),
    toCurrency: normalizeCurrencyCode(pair.toCurrency),
  };
}

export function getFavoritePairKey(pair: FavoriteCurrencyPair) {
  const normalizedPair = normalizeFavoritePair(pair);

  return `${normalizedPair.fromCurrency}/${normalizedPair.toCurrency}`;
}

export function findFavorite(favorites: Favorite[], pair: FavoriteCurrencyPair) {
  const key = getFavoritePairKey(pair);

  return favorites.find((favorite) => getFavoritePairKey(favorite) === key) ?? null;
}
