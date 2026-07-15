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
} from "@/features/favorites/model/favorites";
import { createFavorite, deleteFavorite } from "@/features/favorites/api/client";
import {
  addOptimisticFavorite,
  removeOptimisticFavorite,
  replaceOptimisticFavorite,
  useOptimisticFavorites,
} from "@/features/favorites/stores/optimistic-favorites";
import { useDataUnavailableError } from "@/features/home/hooks/use-data-unavailable-error";

type ConverterFavoriteButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  favoritesPromise: Promise<Favorite[]>;
};

const ConverterFavoritePairContext = React.createContext<FavoriteCurrencyPair | null>(null);

function ConverterFavoritePairProvider({
  children,
  pair,
}: {
  children: React.ReactNode;
  pair: FavoriteCurrencyPair;
}) {
  return (
    <ConverterFavoritePairContext.Provider value={pair}>
      {children}
    </ConverterFavoritePairContext.Provider>
  );
}

function useConverterFavoritePair() {
  const pair = React.use(ConverterFavoritePairContext);

  if (pair === null) {
    throw new Error(
      "ConverterFavoriteButton must be rendered inside ConverterFavoritePairProvider"
    );
  }

  return pair;
}

function ConverterFavoriteButton({ favoritesPromise, ...props }: ConverterFavoriteButtonProps) {
  const router = useRouter();
  const showDataUnavailableError = useDataUnavailableError();
  const initialFavorites = React.use(favoritesPromise);
  const pair = useConverterFavoritePair();
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
      {...props}
      aria-label={isFavorite ? "Remove" : "Favorite"}
      pinned={isFavorite}
      onClick={toggleFavorite}
    />
  );
}

export { ConverterFavoriteButton, ConverterFavoritePairProvider };
