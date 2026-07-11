"use server";

import { isGuestModeFromCookies } from "@/features/guest-session/guest-session";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import type { Favorite, FavoriteCurrencyPair } from "./favorites";
import {
  createGuestFavoriteStore,
  createSupabaseFavoriteStore,
  type FavoriteStore,
} from "./store";

async function getAuthenticatedFavoriteStore(): Promise<FavoriteStore> {
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

  return createSupabaseFavoriteStore({ supabase, userId: user.id });
}

async function getFavoriteStore(): Promise<FavoriteStore> {
  const cookieStore = await cookies();

  return isGuestModeFromCookies(cookieStore)
    ? createGuestFavoriteStore(cookieStore)
    : getAuthenticatedFavoriteStore();
}

export async function createFavorite(pair: FavoriteCurrencyPair): Promise<Favorite> {
  const store = await getFavoriteStore();

  return store.create(pair);
}

export async function deleteFavorite(pair: FavoriteCurrencyPair): Promise<void> {
  const store = await getFavoriteStore();

  await store.delete(pair);
}
