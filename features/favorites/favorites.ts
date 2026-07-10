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

export class InvalidFavoritePairError extends Error {
  constructor() {
    super("Favorite currency pair must contain two distinct three-letter currency codes.");
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

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

export function parseFavoritePair(value: unknown): FavoriteCurrencyPair {
  if (
    !isRecord(value) ||
    typeof value.fromCurrency !== "string" ||
    typeof value.toCurrency !== "string"
  ) {
    throw new InvalidFavoritePairError();
  }

  const pair = normalizeFavoritePair({
    fromCurrency: value.fromCurrency,
    toCurrency: value.toCurrency,
  });

  if (
    !/^[A-Z]{3}$/.test(pair.fromCurrency) ||
    !/^[A-Z]{3}$/.test(pair.toCurrency) ||
    pair.fromCurrency === pair.toCurrency
  ) {
    throw new InvalidFavoritePairError();
  }

  return pair;
}

export function getFavoritePairKey(pair: FavoriteCurrencyPair) {
  const normalizedPair = normalizeFavoritePair(pair);

  return `${normalizedPair.fromCurrency}/${normalizedPair.toCurrency}`;
}

export function findFavorite(favorites: Favorite[], pair: FavoriteCurrencyPair) {
  const key = getFavoritePairKey(pair);

  return favorites.find((favorite) => getFavoritePairKey(favorite) === key) ?? null;
}
