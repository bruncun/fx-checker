"use server";

import { createClient } from "@/lib/supabase/server";
import {
  mapFavorite,
  normalizeFavoritePair,
  type Favorite,
  type FavoriteCurrencyPair,
} from "./favorites";

const FAVORITES_SELECT = "id, from_currency, to_currency, created_at";

async function getAuthenticatedUserContext() {
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

  return { supabase, userId: user.id };
}

export async function createFavorite(pair: FavoriteCurrencyPair): Promise<Favorite> {
  const { supabase, userId } = await getAuthenticatedUserContext();
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
}

export async function deleteFavorite(pair: FavoriteCurrencyPair): Promise<void> {
  const { supabase, userId } = await getAuthenticatedUserContext();
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
}
