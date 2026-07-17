"use client";

import * as React from "react";
import type { Favorite, FavoriteCurrencyPair } from "../model/favorites";
import { createFavorite, deleteFavorite } from "../api/client-actions";

type FavoriteMutations = {
  createFavorite: (pair: FavoriteCurrencyPair) => Promise<Favorite>;
  deleteFavorite: (pair: FavoriteCurrencyPair) => Promise<void>;
};

export function useFavoriteMutations(): FavoriteMutations {
  return React.useMemo(
    () => ({
      createFavorite,
      deleteFavorite,
    }),
    []
  );
}
