import { createClient } from "@/lib/supabase/server";
import {
  GUEST_FAVORITES_COOKIE,
  isGuestModeFromCookies,
  readGuestFavoritesCookie,
} from "@/features/guest-session/guest-session";
import { hasEnvVars } from "@/lib/utils";
import { cookies } from "next/headers";
import { mapFavorite, type Favorite } from "./favorites";

export async function getServerFavorites(): Promise<Favorite[]> {
  const cookieStore = await cookies();

  if (
    isGuestModeFromCookies(cookieStore) ||
    !hasEnvVars ||
    process.env.FX_CHECKER_E2E_AUTH_BYPASS === "1"
  ) {
    return readGuestFavoritesCookie(cookieStore.get(GUEST_FAVORITES_COOKIE)?.value);
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("favorites")
    .select("id, from_currency, to_currency, created_at")
    .order("created_at", { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []).map(mapFavorite);
}
