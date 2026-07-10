import { normalizeFavoritePair, type Favorite, type FavoriteCurrencyPair } from "./favorites";

export async function createFavorite(pair: FavoriteCurrencyPair): Promise<Favorite> {
  const response = await fetch("/api/favorites", {
    body: JSON.stringify(normalizeFavoritePair(pair)),
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
  });

  if (!response.ok) {
    throw new Error("Failed to create favorite.");
  }

  return (await response.json()) as Favorite;
}

export async function deleteFavorite(pair: FavoriteCurrencyPair): Promise<void> {
  const response = await fetch("/api/favorites", {
    body: JSON.stringify(normalizeFavoritePair(pair)),
    headers: {
      "Content-Type": "application/json",
    },
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error("Failed to delete favorite.");
  }
}
