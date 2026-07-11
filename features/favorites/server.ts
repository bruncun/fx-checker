import { createClient } from "@/lib/supabase/server";
import { isGuestModeFromCookies } from "@/features/guest-session/guest-session";
import { hasEnvVars } from "@/lib/utils";
import { cookies } from "next/headers";
import type { Favorite } from "./favorites";
import {
  createGuestFavoriteStore,
  createSupabaseFavoriteStore,
  type FavoriteStore,
} from "./store";

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
  const store = await getFavoriteReadStore();

  return store.list();
}
