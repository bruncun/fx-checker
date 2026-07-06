"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { FavoriteButton } from "@/components/ui/favorite-button";
import {
  findFavorite,
  getFavoritePairKey,
  normalizeFavoritePair,
  type Favorite,
  type FavoriteCurrencyPair,
} from "@/features/favorites";
import { createFavorite, deleteFavorite } from "@/features/favorites/actions";
import {
  addOptimisticFavorite,
  removeOptimisticFavorite,
  replaceOptimisticFavorite,
  useOptimisticFavorites,
} from "@/features/favorites/optimistic-favorites";
import { useDataUnavailableError } from "@/features/home/components/use-data-unavailable-error";

type ConverterFavoriteButtonProps = {
  favoritesPromise: Promise<Favorite[]>;
  pair: FavoriteCurrencyPair;
};

function ConverterFavoriteButton({ favoritesPromise, pair }: ConverterFavoriteButtonProps) {
  const router = useRouter();
  const showDataUnavailableError = useDataUnavailableError();
  const initialFavorites = React.use(favoritesPromise);
  const favorites = useOptimisticFavorites(initialFavorites);
  const normalizedPair = normalizeFavoritePair(pair);
  const existingFavorite = findFavorite(favorites, normalizedPair);
  const isFavorite = existingFavorite !== null;

  function toggleFavorite() {
    if (existingFavorite) {
      removeOptimisticFavorite(normalizedPair);

      React.startTransition(async () => {
        try {
          await deleteFavorite(normalizedPair);
          router.refresh();
        } catch (error) {
          console.error("Failed to delete favorite", error);
          addOptimisticFavorite(existingFavorite);
          showDataUnavailableError();
        }
      });

      return;
    }

    const pendingFavorite: Favorite = {
      ...normalizedPair,
      createdAt: new Date().toISOString(),
      id: `optimistic:${getFavoritePairKey(normalizedPair)}`,
    };

    addOptimisticFavorite(pendingFavorite);

    React.startTransition(async () => {
      try {
        const createdFavorite = await createFavorite(normalizedPair);

        replaceOptimisticFavorite(pendingFavorite, createdFavorite);
        router.refresh();
      } catch (error) {
        console.error("Failed to create favorite", error);
        removeOptimisticFavorite(normalizedPair);
        showDataUnavailableError();
      }
    });
  }

  return (
    <FavoriteButton
      aria-label={
        isFavorite
          ? `Remove ${normalizedPair.fromCurrency}/${normalizedPair.toCurrency} from favorites`
          : `Favorite ${normalizedPair.fromCurrency}/${normalizedPair.toCurrency}`
      }
      pinned={isFavorite}
      onClick={toggleFavorite}
    />
  );
}

export { ConverterFavoriteButton };
