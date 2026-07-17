import type { Favorite, FavoriteCurrencyPair } from "../model/favorites";

export async function createFavorite(pair: FavoriteCurrencyPair): Promise<Favorite> {
  const { createFavorite } = await import("./actions");

  return createFavorite(pair);
}

export async function deleteFavorite(pair: FavoriteCurrencyPair): Promise<void> {
  const { deleteFavorite } = await import("./actions");

  return deleteFavorite(pair);
}
