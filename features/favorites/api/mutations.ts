import { isGuestModeFromCookies } from "@/features/guest-session/model/guest-session";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import type { Favorite, FavoriteCurrencyPair } from "../model/favorites";
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

async function getFavoriteMutationStore(): Promise<FavoriteStore> {
  const cookieStore = await cookies();

  return isGuestModeFromCookies(cookieStore)
    ? createGuestFavoriteStore(cookieStore)
    : getAuthenticatedFavoriteStore();
}

export async function createFavoriteMutation(pair: FavoriteCurrencyPair): Promise<Favorite> {
  const store = await getFavoriteMutationStore();

  return store.create(pair);
}

export async function deleteFavoriteMutation(pair: FavoriteCurrencyPair): Promise<void> {
  const store = await getFavoriteMutationStore();

  await store.delete(pair);
}
