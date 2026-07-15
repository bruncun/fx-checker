import { createClient } from "@/lib/supabase/server";
import { isGuestModeFromCookies } from "@/features/guest-session/model/guest-session";
import { hasEnvVars } from "@/lib/env";
import { cacheLife, cacheTag } from "next/cache";
import { cookies } from "next/headers";
import type { Favorite } from "../model/favorites";
import {
  createGuestFavoriteStore,
  createSupabaseFavoriteStore,
  type FavoriteStore,
} from "../stores/store";

export const FAVORITES_CACHE_TAG = "favorites";

async function getFavoriteReadStore(): Promise<FavoriteStore> {
  const cookieStore = await cookies();

  if (
    isGuestModeFromCookies(cookieStore) ||
    !hasEnvVars ||
    process.env.FX_CHECKER_E2E_AUTH_BYPASS === "1"
  ) {
    return createGuestFavoriteStore(cookieStore);
  }

  const supabase = await createClient();
  return createSupabaseFavoriteStore({ supabase });
}

export async function getServerFavorites(): Promise<Favorite[]> {
  "use cache: private";
  cacheTag(FAVORITES_CACHE_TAG);
  cacheLife("minutes");

  const store = await getFavoriteReadStore();

  return store.list();
}
