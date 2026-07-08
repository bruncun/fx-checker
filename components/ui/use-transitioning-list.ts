"use client";

import * as React from "react";

type TransitioningListEntryContext<TItem> = {
  currentKeys: Set<string>;
  item: TItem;
  key: string;
  previousItems: TItem[];
  previousKeys: Set<string>;
};

type UseTransitioningListOptions<TItem> = {
  entryDurationMs?: number;
  exitDurationMs?: number;
  getEntryContinuationKey?: (context: TransitioningListEntryContext<TItem>) => string | null;
  getKey: (item: TItem) => string;
  items: TItem[];
  shouldAnimateEntry?: (context: TransitioningListEntryContext<TItem>) => boolean;
};

const defaultTransitionDurationMs = 160;

function removeSetValue(currentValues: Set<string>, value: string) {
  if (!currentValues.has(value)) {
    return currentValues;
  }

  const nextValues = new Set(currentValues);
  nextValues.delete(value);
  return nextValues;
}

function useTransitioningList<TItem>({
  entryDurationMs = defaultTransitionDurationMs,
  exitDurationMs = defaultTransitionDurationMs,
  getEntryContinuationKey,
  getKey,
  items,
  shouldAnimateEntry = () => true,
}: UseTransitioningListOptions<TItem>) {
  const [enteringKeys, setEnteringKeys] = React.useState(() => new Set<string>());
  const [exitingKeys, setExitingKeys] = React.useState(() => new Set<string>());
  const [isListEntering, setIsListEntering] = React.useState(false);
  const [isEmptyEntering, setIsEmptyEntering] = React.useState(false);
  const previousItemsRef = React.useRef<TItem[] | null>(null);
  const entryTimeoutsRef = React.useRef(new Map<string, ReturnType<typeof setTimeout>>());
  const exitTimeoutsRef = React.useRef(new Map<string, ReturnType<typeof setTimeout>>());
  const listEntryTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const emptyEntryTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearListEntryTimeout = React.useCallback(() => {
    if (!listEntryTimeoutRef.current) {
      return;
    }

    clearTimeout(listEntryTimeoutRef.current);
    listEntryTimeoutRef.current = null;
  }, []);

  const clearEmptyEntryTimeout = React.useCallback(() => {
    if (!emptyEntryTimeoutRef.current) {
      return;
    }

    clearTimeout(emptyEntryTimeoutRef.current);
    emptyEntryTimeoutRef.current = null;
  }, []);

  const markListEntering = React.useCallback(() => {
    clearListEntryTimeout();
    setIsListEntering(true);
    listEntryTimeoutRef.current = setTimeout(() => {
      listEntryTimeoutRef.current = null;
      setIsListEntering(false);
    }, entryDurationMs);
  }, [clearListEntryTimeout, entryDurationMs]);

  const markEmptyEntering = React.useCallback(() => {
    clearEmptyEntryTimeout();
    setIsEmptyEntering(true);
    emptyEntryTimeoutRef.current = setTimeout(() => {
      emptyEntryTimeoutRef.current = null;
      setIsEmptyEntering(false);
    }, entryDurationMs);
  }, [clearEmptyEntryTimeout, entryDurationMs]);

  const markKeyEntering = React.useCallback(
    (key: string) => {
      if (entryTimeoutsRef.current.has(key)) {
        return;
      }

      setEnteringKeys((currentKeys) => new Set(currentKeys).add(key));
      entryTimeoutsRef.current.set(
        key,
        setTimeout(() => {
          entryTimeoutsRef.current.delete(key);
          setEnteringKeys((currentKeys) => removeSetValue(currentKeys, key));
        }, entryDurationMs)
      );
    },
    [entryDurationMs]
  );

  React.useEffect(() => {
    const entryTimeouts = entryTimeoutsRef.current;
    const exitTimeouts = exitTimeoutsRef.current;

    return () => {
      entryTimeouts.forEach((timeout) => {
        clearTimeout(timeout);
      });
      entryTimeouts.clear();
      exitTimeouts.forEach((timeout) => {
        clearTimeout(timeout);
      });
      exitTimeouts.clear();
      clearListEntryTimeout();
      clearEmptyEntryTimeout();
    };
  }, [clearEmptyEntryTimeout, clearListEntryTimeout]);

  React.useLayoutEffect(() => {
    const previousItems = previousItemsRef.current;
    const currentKeys = new Set(items.map(getKey));
    const previousKeys = previousItems ? new Set(previousItems.map(getKey)) : null;

    previousItemsRef.current = items;

    if (!previousItems || !previousKeys) {
      return;
    }

    if (previousKeys.size === 0 && currentKeys.size > 0) {
      markListEntering();
    }

    if (previousKeys.size > 0 && currentKeys.size === 0) {
      markEmptyEntering();
    }

    items.forEach((item) => {
      const key = getKey(item);
      const entryContext = { currentKeys, item, key, previousItems, previousKeys };

      if (previousKeys.has(key)) {
        return;
      }

      const continuationKey = getEntryContinuationKey?.(entryContext);

      if (continuationKey && entryTimeoutsRef.current.has(continuationKey)) {
        markKeyEntering(key);
        return;
      }

      if (!shouldAnimateEntry(entryContext)) {
        return;
      }

      markKeyEntering(key);
    });
  }, [
    getEntryContinuationKey,
    getKey,
    items,
    markEmptyEntering,
    markKeyEntering,
    markListEntering,
    shouldAnimateEntry,
  ]);

  const cancelExit = React.useCallback((key: string) => {
    const timeout = exitTimeoutsRef.current.get(key);

    if (timeout) {
      clearTimeout(timeout);
      exitTimeoutsRef.current.delete(key);
    }

    setExitingKeys((currentKeys) => removeSetValue(currentKeys, key));
  }, []);

  const cancelAllExits = React.useCallback(() => {
    exitTimeoutsRef.current.forEach((timeout) => {
      clearTimeout(timeout);
    });
    exitTimeoutsRef.current.clear();
    setExitingKeys(new Set());
  }, []);

  const startExit = React.useCallback(
    (key: string, onExitComplete: () => void) => {
      if (exitTimeoutsRef.current.has(key)) {
        return false;
      }

      setExitingKeys((currentKeys) => new Set(currentKeys).add(key));
      exitTimeoutsRef.current.set(
        key,
        setTimeout(() => {
          exitTimeoutsRef.current.delete(key);
          onExitComplete();
          setExitingKeys((currentKeys) => removeSetValue(currentKeys, key));
        }, exitDurationMs)
      );
      return true;
    },
    [exitDurationMs]
  );

  const hasPendingExit = React.useCallback((key: string) => exitTimeoutsRef.current.has(key), []);

  const hasPendingExits = React.useCallback(() => exitTimeoutsRef.current.size > 0, []);

  return {
    cancelAllExits,
    cancelExit,
    enteringKeys,
    exitingKeys,
    hasPendingExit,
    hasPendingExits,
    isEmptyEntering,
    isListEntering,
    startExit,
  };
}

export { useTransitioningList };
