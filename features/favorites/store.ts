import "server-only";

import {
  addGuestFavorite,
  GUEST_FAVORITES_COOKIE,
  readGuestFavoritesCookie,
  removeGuestFavorite,
  serializeGuestFavoritesCookie,
} from "@/features/guest-session/guest-session";
import { createClient } from "@/lib/supabase/server";
import {
  mapFavorite,
  normalizeFavoritePair,
  type Favorite,
  type FavoriteCurrencyPair,
} from "./favorites";

const FAVORITES_SELECT = "id, from_currency, to_currency, created_at";

type CookieStore = {
  get(name: string): { value: string } | undefined;
  set(name: string, value: string, options?: { path?: string; sameSite?: "lax" }): void;
};

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

export type FavoriteStore = {
  create(pair: FavoriteCurrencyPair): Promise<Favorite>;
  delete(pair: FavoriteCurrencyPair): Promise<void>;
  list(): Promise<Favorite[]>;
};

export function createGuestFavoriteStore(cookieStore: CookieStore): FavoriteStore {
  return {
    async create(pair) {
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
    },
    async delete(pair) {
      const favorites = readGuestFavoritesCookie(cookieStore.get(GUEST_FAVORITES_COOKIE)?.value);

      cookieStore.set(
        GUEST_FAVORITES_COOKIE,
        serializeGuestFavoritesCookie(removeGuestFavorite(favorites, pair)),
        {
          path: "/",
          sameSite: "lax",
        }
      );
    },
    async list() {
      return readGuestFavoritesCookie(cookieStore.get(GUEST_FAVORITES_COOKIE)?.value);
    },
  };
}

export function createSupabaseFavoriteStore({
  supabase,
  userId,
}: {
  supabase: SupabaseClient;
  userId?: string;
}): FavoriteStore {
  return {
    async create(pair) {
      if (!userId) {
        throw new Error("You must be signed in to update favorites.");
      }

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
    },
    async delete(pair) {
      if (!userId) {
        throw new Error("You must be signed in to update favorites.");
      }

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
    },
    async list() {
      const { data, error } = await supabase
        .from("favorites")
        .select(FAVORITES_SELECT)
        .order("created_at", { ascending: true });

      if (error) {
        throw error;
      }

      return (data ?? []).map(mapFavorite);
    },
  };
}
