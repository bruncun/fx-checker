import { createClient } from "@/lib/supabase/server";
import { mapFavorite, type Favorite } from "./favorites";

export async function getServerFavorites(): Promise<Favorite[]> {
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
