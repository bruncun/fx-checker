"use server";

import { updateTag } from "next/cache";
import type { Favorite, FavoriteCurrencyPair } from "../model/favorites";
import { parseFavoritePair } from "../model/favorites";
import { createFavoriteMutation, deleteFavoriteMutation } from "./mutations";
import { FAVORITES_CACHE_TAG } from "./tags";

export async function createFavorite(pair: FavoriteCurrencyPair): Promise<Favorite> {
  const favorite = await createFavoriteMutation(parseFavoritePair(pair));

  updateTag(FAVORITES_CACHE_TAG);

  return favorite;
}

export async function deleteFavorite(pair: FavoriteCurrencyPair): Promise<void> {
  await deleteFavoriteMutation(parseFavoritePair(pair));
  updateTag(FAVORITES_CACHE_TAG);
}
