import { createClient } from "@/lib/supabase/client";
import {
  mapFavorite,
  normalizeFavoritePair,
  type Favorite,
  type FavoriteCurrencyPair,
} from "./favorites";

export async function createFavorite(pair: FavoriteCurrencyPair): Promise<Favorite> {
  const supabase = createClient();
  const normalizedPair = normalizeFavoritePair(pair);
  const { data, error } = await supabase
    .from("favorites")
    .insert({
      from_currency: normalizedPair.fromCurrency,
      to_currency: normalizedPair.toCurrency,
    })
    .select("id, from_currency, to_currency, created_at")
    .single();

  if (error) {
    throw error;
  }

  return mapFavorite(data);
}

export async function deleteFavorite(pair: FavoriteCurrencyPair): Promise<void> {
  const supabase = createClient();
  const normalizedPair = normalizeFavoritePair(pair);
  const { error } = await supabase
    .from("favorites")
    .delete()
    .eq("from_currency", normalizedPair.fromCurrency)
    .eq("to_currency", normalizedPair.toCurrency);

  if (error) {
    throw error;
  }
}
