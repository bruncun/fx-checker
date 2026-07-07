import {
  normalizeConversionInput,
  type Conversion,
  type CreateConversionInput,
} from "@/features/conversion-log/conversion-log";
import {
  getFavoritePairKey,
  normalizeFavoritePair,
  type Favorite,
  type FavoriteCurrencyPair,
} from "@/features/favorites/favorites";

export const GUEST_MODE_COOKIE = "fx_checker_guest";
export const GUEST_FAVORITES_COOKIE = "fx_checker_guest_favorites";
export const GUEST_CONVERSIONS_COOKIE = "fx_checker_guest_conversions";
export const GUEST_ALERT_DISMISSED_COOKIE = "fx_checker_guest_alert_dismissed";

const MAX_GUEST_FAVORITES = 100;
const MAX_GUEST_CONVERSIONS = 30;

type CookieReader = {
  get(name: string): { value: string } | undefined;
};

type GuestFavoriteRecord = [string, string, string, string];
type GuestConversionRecord = [string, string, string, string, string, string];

function createGuestId(prefix: string) {
  return `${prefix}:${globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2)}`;
}

function readJsonCookie<T>(value: string | undefined, fallback: T): T {
  if (!value) {
    return fallback;
  }

  try {
    return JSON.parse(decodeURIComponent(value)) as T;
  } catch {
    return fallback;
  }
}

function writeJsonCookie(value: unknown) {
  return encodeURIComponent(JSON.stringify(value));
}

export function isGuestCookieValue(value: string | undefined) {
  return value === "1";
}

export function isGuestModeFromCookies(cookies: CookieReader) {
  return isGuestCookieValue(cookies.get(GUEST_MODE_COOKIE)?.value);
}

export function readGuestFavoritesCookie(value: string | undefined): Favorite[] {
  const records = readJsonCookie<GuestFavoriteRecord[]>(value, []);

  return records.flatMap((record) => {
    const [id, fromCurrency, toCurrency, createdAt] = record;

    return id && fromCurrency && toCurrency && createdAt
      ? [{ createdAt, fromCurrency, id, toCurrency }]
      : [];
  });
}

export function serializeGuestFavoritesCookie(favorites: Favorite[]) {
  const records: GuestFavoriteRecord[] = favorites
    .slice(0, MAX_GUEST_FAVORITES)
    .map((favorite) => [
      favorite.id,
      favorite.fromCurrency,
      favorite.toCurrency,
      favorite.createdAt,
    ]);

  return writeJsonCookie(records);
}

export function readGuestConversionsCookie(value: string | undefined): Conversion[] {
  const records = readJsonCookie<GuestConversionRecord[]>(value, []);

  return records.flatMap((record) => {
    const [id, fromCurrency, toCurrency, sendAmount, receiveAmount, createdAt] = record;

    return id && fromCurrency && toCurrency && sendAmount && receiveAmount && createdAt
      ? [{ createdAt, fromCurrency, id, receiveAmount, sendAmount, toCurrency }]
      : [];
  });
}

export function serializeGuestConversionsCookie(conversions: Conversion[]) {
  const records: GuestConversionRecord[] = conversions
    .slice(0, MAX_GUEST_CONVERSIONS)
    .map((conversion) => [
      conversion.id,
      conversion.fromCurrency,
      conversion.toCurrency,
      conversion.sendAmount,
      conversion.receiveAmount,
      conversion.createdAt,
    ]);

  return writeJsonCookie(records);
}

export function addGuestFavorite(favorites: Favorite[], pair: FavoriteCurrencyPair): Favorite {
  const normalizedPair = normalizeFavoritePair(pair);
  const pairKey = getFavoritePairKey(normalizedPair);
  const existingFavorite = favorites.find((favorite) => getFavoritePairKey(favorite) === pairKey);

  if (existingFavorite) {
    return existingFavorite;
  }

  return {
    ...normalizedPair,
    createdAt: new Date().toISOString(),
    id: createGuestId(pairKey),
  };
}

export function removeGuestFavorite(favorites: Favorite[], pair: FavoriteCurrencyPair) {
  const pairKey = getFavoritePairKey(pair);

  return favorites.filter((favorite) => getFavoritePairKey(favorite) !== pairKey);
}

export function addGuestConversion(input: CreateConversionInput): Conversion {
  const normalizedInput = normalizeConversionInput(input);

  return {
    ...normalizedInput,
    createdAt: new Date().toISOString(),
    id: createGuestId("guest-conversion"),
  };
}

export function trimGuestConversions(conversions: Conversion[]) {
  return conversions.slice(0, MAX_GUEST_CONVERSIONS);
}
