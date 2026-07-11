"use client";

import * as React from "react";

import {
  findFavorite,
  getFavoritePairKey,
  type Favorite,
  type FavoriteCurrencyPair,
} from "../model/favorites";

const EMPTY_FAVORITES: Favorite[] = [];

let favoriteSnapshot: Favorite[] | null = null;
let favoriteCountSnapshot: number | null = null;
const listeners = new Set<() => void>();

function emitChange() {
  for (const listener of listeners) {
    listener();
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot() {
  return favoriteSnapshot ?? EMPTY_FAVORITES;
}

function getCountSnapshot() {
  return favoriteSnapshot?.length ?? favoriteCountSnapshot;
}

function setFavoriteSnapshot(favorites: Favorite[]) {
  favoriteSnapshot = favorites;
  favoriteCountSnapshot = favorites.length;
  emitChange();
}

function addOptimisticFavorite(favorite: Favorite) {
  const favorites = getSnapshot();

  if (findFavorite(favorites, favorite)) {
    return;
  }

  if (favoriteSnapshot) {
    setFavoriteSnapshot([...favorites, favorite]);
    return;
  }

  favoriteCountSnapshot = (favoriteCountSnapshot ?? 0) + 1;
  emitChange();
}

function removeOptimisticFavorite(pair: FavoriteCurrencyPair) {
  const pairKey = getFavoritePairKey(pair);

  if (favoriteSnapshot) {
    setFavoriteSnapshot(
      getSnapshot().filter((favorite) => getFavoritePairKey(favorite) !== pairKey)
    );
    return;
  }

  favoriteCountSnapshot = Math.max(0, (favoriteCountSnapshot ?? 0) - 1);
  emitChange();
}

function replaceOptimisticFavorite(optimisticFavorite: Favorite, favorite: Favorite) {
  if (!favoriteSnapshot) {
    return;
  }

  const optimisticKey = getFavoritePairKey(optimisticFavorite);
  const favoriteKey = getFavoritePairKey(favorite);
  const favorites = getSnapshot().filter((currentFavorite) => {
    const currentKey = getFavoritePairKey(currentFavorite);

    return currentFavorite.id !== optimisticFavorite.id && currentKey !== favoriteKey;
  });

  if (optimisticKey === favoriteKey || !findFavorite(favorites, favorite)) {
    setFavoriteSnapshot([...favorites, favorite]);
  }
}

function useOptimisticFavorites(initialFavorites: Favorite[]) {
  const favorites = React.useSyncExternalStore(subscribe, getSnapshot, () => initialFavorites);

  React.useEffect(() => {
    setFavoriteSnapshot(initialFavorites);
  }, [initialFavorites]);

  return favoriteSnapshot === null ? initialFavorites : favorites;
}

function useOptimisticFavoriteCount(initialCount: number) {
  const count = React.useSyncExternalStore(subscribe, getCountSnapshot, () => initialCount);

  React.useEffect(() => {
    if (!favoriteSnapshot) {
      favoriteCountSnapshot = initialCount;
      emitChange();
    }
  }, [initialCount]);

  return count ?? initialCount;
}

export {
  addOptimisticFavorite,
  removeOptimisticFavorite,
  replaceOptimisticFavorite,
  useOptimisticFavoriteCount,
  useOptimisticFavorites,
};
