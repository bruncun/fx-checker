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

type ConverterFavoriteButtonProps = {
  favoritesPromise: Promise<Favorite[]>;
  pair: FavoriteCurrencyPair;
};

function ConverterFavoriteButton({ favoritesPromise, pair }: ConverterFavoriteButtonProps) {
  const router = useRouter();
  const initialFavorites = React.use(favoritesPromise);
  const [favorites, setFavorites] = React.useState(initialFavorites);
  const normalizedPair = normalizeFavoritePair(pair);
  const existingFavorite = findFavorite(favorites, normalizedPair);
  const isFavorite = existingFavorite !== null;

  function toggleFavorite() {
    if (existingFavorite) {
      React.startTransition(async () => {
        setFavorites((currentFavorites) =>
          currentFavorites.filter(
            (favorite) => getFavoritePairKey(favorite) !== getFavoritePairKey(normalizedPair)
          )
        );

        try {
          await deleteFavorite(normalizedPair);
          router.refresh();
        } catch (error) {
          console.error("Failed to delete favorite", error);
          setFavorites((currentFavorites) => [...currentFavorites, existingFavorite]);
        }
      });

      return;
    }

    const pendingFavorite: Favorite = {
      ...normalizedPair,
      createdAt: new Date().toISOString(),
      id: `optimistic:${getFavoritePairKey(normalizedPair)}`,
    };

    React.startTransition(async () => {
      setFavorites((currentFavorites) => [...currentFavorites, pendingFavorite]);

      try {
        const createdFavorite = await createFavorite(normalizedPair);

        setFavorites((currentFavorites) => [
          ...currentFavorites.filter(
            (favorite) => getFavoritePairKey(favorite) !== getFavoritePairKey(createdFavorite)
          ),
          createdFavorite,
        ]);
        router.refresh();
      } catch (error) {
        console.error("Failed to create favorite", error);
        setFavorites((currentFavorites) =>
          currentFavorites.filter(
            (favorite) => getFavoritePairKey(favorite) !== getFavoritePairKey(normalizedPair)
          )
        );
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
