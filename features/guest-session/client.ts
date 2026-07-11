import {
  addGuestConversion,
  addGuestFavorite,
  GUEST_CONVERSIONS_COOKIE,
  GUEST_FAVORITES_COOKIE,
  GUEST_MODE_COOKIE,
  isGuestCookieValue,
  readGuestConversionsCookie,
  readGuestFavoritesCookie,
  removeGuestFavorite,
  serializeGuestConversionsCookie,
  serializeGuestFavoritesCookie,
  trimGuestConversions,
} from "./guest-session";
import type {
  Conversion,
  CreateConversionInput,
} from "@/features/conversion-log/conversion-log";
import type { Favorite, FavoriteCurrencyPair } from "@/features/favorites/favorites";

function getCookieValue(name: string) {
  return document.cookie
    .split("; ")
    .find((cookie) => cookie.startsWith(`${name}=`))
    ?.slice(name.length + 1);
}

function setSessionCookie(name: string, value: string) {
  document.cookie = `${name}=${value}; Path=/; SameSite=Lax`;
}

export function isGuestMode() {
  return isGuestCookieValue(getCookieValue(GUEST_MODE_COOKIE));
}

export function createGuestFavorite(pair: FavoriteCurrencyPair): Favorite {
  const favorites = readGuestFavoritesCookie(getCookieValue(GUEST_FAVORITES_COOKIE));
  const favorite = addGuestFavorite(favorites, pair);
  const nextFavorites = favorites.some((currentFavorite) => currentFavorite.id === favorite.id)
    ? favorites
    : [...favorites, favorite];

  setSessionCookie(GUEST_FAVORITES_COOKIE, serializeGuestFavoritesCookie(nextFavorites));

  return favorite;
}

export function deleteGuestFavorite(pair: FavoriteCurrencyPair) {
  const favorites = readGuestFavoritesCookie(getCookieValue(GUEST_FAVORITES_COOKIE));

  setSessionCookie(
    GUEST_FAVORITES_COOKIE,
    serializeGuestFavoritesCookie(removeGuestFavorite(favorites, pair))
  );
}

export function createGuestConversion(input: CreateConversionInput): Conversion {
  const conversions = readGuestConversionsCookie(getCookieValue(GUEST_CONVERSIONS_COOKIE));
  const conversion = addGuestConversion(input);

  setSessionCookie(
    GUEST_CONVERSIONS_COOKIE,
    serializeGuestConversionsCookie(trimGuestConversions([conversion, ...conversions]))
  );

  return conversion;
}

export function deleteGuestConversion(id: string) {
  const conversions = readGuestConversionsCookie(getCookieValue(GUEST_CONVERSIONS_COOKIE));

  setSessionCookie(
    GUEST_CONVERSIONS_COOKIE,
    serializeGuestConversionsCookie(conversions.filter((conversion) => conversion.id !== id))
  );
}

export function deleteAllGuestConversions() {
  setSessionCookie(GUEST_CONVERSIONS_COOKIE, serializeGuestConversionsCookie([]));
}
