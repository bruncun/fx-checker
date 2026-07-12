"use server";

import { isGuestModeFromCookies } from "@/features/guest-session/model/guest-session";
import { createClient } from "@/lib/supabase/server";
import { revalidateTag } from "next/cache";
import { cookies } from "next/headers";
import type { Favorite, FavoriteCurrencyPair } from "../model/favorites";
import { FAVORITES_CACHE_TAG } from "./server";
import {
  createGuestFavoriteStore,
  createSupabaseFavoriteStore,
  type FavoriteStore,
} from "../stores/store";

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
  const favorite = await store.create(pair);

  revalidateTag(FAVORITES_CACHE_TAG, { expire: 0 });

  return favorite;
}

export async function deleteFavorite(pair: FavoriteCurrencyPair): Promise<void> {
  const store = await getFavoriteStore();

  await store.delete(pair);
  revalidateTag(FAVORITES_CACHE_TAG, { expire: 0 });
}
