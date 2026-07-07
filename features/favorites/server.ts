import { createClient } from "@/lib/supabase/server";
import { hasEnvVars } from "@/lib/utils";
import { mapFavorite, type Favorite } from "./favorites";

export async function getServerFavorites(): Promise<Favorite[]> {
  if (!hasEnvVars || process.env.FX_CHECKER_E2E_AUTH_BYPASS === "1") {
    return [];
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
