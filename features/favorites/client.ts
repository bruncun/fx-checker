import { createClient } from "@/lib/supabase/client";
import {
  mapFavorite,
  normalizeFavoritePair,
  type Favorite,
  type FavoriteCurrencyPair,
} from "./favorites";

const FAVORITES_SELECT = "id, from_currency, to_currency, created_at";

export async function getFavorites(): Promise<Favorite[]> {
  const supabase = createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw userError;
  }

  if (!user) {
    return [];
  }

  const { data, error } = await supabase
    .from("favorites")
    .select(FAVORITES_SELECT)
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  if (error) {
    throw error;
  }

  return data.map(mapFavorite);
}

export async function createFavorite(pair: FavoriteCurrencyPair): Promise<Favorite> {
  const supabase = createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw userError;
  }

  if (!user) {
    throw new Error("You must be signed in to create favorites.");
  }

  const normalizedPair = normalizeFavoritePair(pair);
  const { data, error } = await supabase
    .from("favorites")
    .insert({
      from_currency: normalizedPair.fromCurrency,
      to_currency: normalizedPair.toCurrency,
      user_id: user.id,
    })
    .select(FAVORITES_SELECT)
    .single();

  if (error) {
    throw error;
  }

  return mapFavorite(data);
}

export async function deleteFavorite(pair: FavoriteCurrencyPair): Promise<void> {
  const supabase = createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw userError;
  }

  if (!user) {
    throw new Error("You must be signed in to delete favorites.");
  }

  const normalizedPair = normalizeFavoritePair(pair);
  const { error } = await supabase
    .from("favorites")
    .delete()
    .eq("user_id", user.id)
    .eq("from_currency", normalizedPair.fromCurrency)
    .eq("to_currency", normalizedPair.toCurrency);

  if (error) {
    throw error;
  }
}
