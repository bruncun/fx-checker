"use server";

import { createClient } from "@/lib/supabase/server";
import {
  addGuestFavorite,
  GUEST_FAVORITES_COOKIE,
  isGuestModeFromCookies,
  readGuestFavoritesCookie,
  removeGuestFavorite,
  serializeGuestFavoritesCookie,
} from "@/features/guest-session/guest-session";
import { cookies } from "next/headers";
import {
  mapFavorite,
  normalizeFavoritePair,
  type Favorite,
  type FavoriteCurrencyPair,
} from "./favorites";

const FAVORITES_SELECT = "id, from_currency, to_currency, created_at";

async function getAuthenticatedUserContext() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    throw error;
  }

  if (!user) {
    throw new Error("You must be signed in to update favorites.");
  }

  return { supabase, userId: user.id };
}

export async function createFavorite(pair: FavoriteCurrencyPair): Promise<Favorite> {
  const cookieStore = await cookies();

  if (isGuestModeFromCookies(cookieStore)) {
    const favorites = readGuestFavoritesCookie(cookieStore.get(GUEST_FAVORITES_COOKIE)?.value);
    const favorite = addGuestFavorite(favorites, pair);
    const nextFavorites = favorites.some((currentFavorite) => currentFavorite.id === favorite.id)
      ? favorites
      : [...favorites, favorite];

    cookieStore.set(GUEST_FAVORITES_COOKIE, serializeGuestFavoritesCookie(nextFavorites), {
      path: "/",
      sameSite: "lax",
    });

    return favorite;
  }

  const { supabase, userId } = await getAuthenticatedUserContext();
  const normalizedPair = normalizeFavoritePair(pair);
  const { data, error } = await supabase
    .from("favorites")
    .insert({
      from_currency: normalizedPair.fromCurrency,
      to_currency: normalizedPair.toCurrency,
      user_id: userId,
    })
    .select(FAVORITES_SELECT)
    .single();

  if (error) {
    throw error;
  }

  return mapFavorite(data);
}

export async function deleteFavorite(pair: FavoriteCurrencyPair): Promise<void> {
  const cookieStore = await cookies();

  if (isGuestModeFromCookies(cookieStore)) {
    const favorites = readGuestFavoritesCookie(cookieStore.get(GUEST_FAVORITES_COOKIE)?.value);

    cookieStore.set(
      GUEST_FAVORITES_COOKIE,
      serializeGuestFavoritesCookie(removeGuestFavorite(favorites, pair)),
      {
        path: "/",
        sameSite: "lax",
      }
    );

    return;
  }

  const { supabase, userId } = await getAuthenticatedUserContext();
  const normalizedPair = normalizeFavoritePair(pair);
  const { error } = await supabase
    .from("favorites")
    .delete()
    .eq("user_id", userId)
    .eq("from_currency", normalizedPair.fromCurrency)
    .eq("to_currency", normalizedPair.toCurrency);

  if (error) {
    throw error;
  }
}
