"use client";

import * as React from "react";

import type { Conversion } from "../model/conversion-log";

const EMPTY_CONVERSIONS: Conversion[] = [];

let conversionSnapshot: Conversion[] | null = null;
let conversionCountSnapshot: number | null = null;
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
  return conversionSnapshot ?? EMPTY_CONVERSIONS;
}

function getCountSnapshot() {
  return conversionSnapshot?.length ?? conversionCountSnapshot;
}

function setConversionSnapshot(conversions: Conversion[]) {
  conversionSnapshot = conversions;
  conversionCountSnapshot = conversions.length;
  emitChange();
}

function addOptimisticConversion(conversion: Conversion) {
  if (conversionSnapshot) {
    setConversionSnapshot([conversion, ...getSnapshot()]);
    return;
  }

  conversionCountSnapshot = (conversionCountSnapshot ?? 0) + 1;
  emitChange();
}

function removeOptimisticConversion(id: string) {
  if (conversionSnapshot) {
    setConversionSnapshot(getSnapshot().filter((conversion) => conversion.id !== id));
    return;
  }

  conversionCountSnapshot = Math.max(0, (conversionCountSnapshot ?? 0) - 1);
  emitChange();
}

function replaceOptimisticConversion(optimisticId: string, conversion: Conversion) {
  if (!conversionSnapshot) {
    return;
  }

  setConversionSnapshot([
    conversion,
    ...getSnapshot().filter((currentConversion) => currentConversion.id !== optimisticId),
  ]);
}

function clearOptimisticConversions() {
  conversionSnapshot = [];
  conversionCountSnapshot = 0;
  emitChange();
}

function useOptimisticConversions(initialConversions: Conversion[]) {
  const conversions = React.useSyncExternalStore(subscribe, getSnapshot, () => initialConversions);

  React.useEffect(() => {
    setConversionSnapshot(initialConversions);
  }, [initialConversions]);

  return conversionSnapshot === null ? initialConversions : conversions;
}

function useOptimisticConversionCount(initialCount: number) {
  const count = React.useSyncExternalStore(subscribe, getCountSnapshot, () => initialCount);

  React.useEffect(() => {
    if (!conversionSnapshot) {
      conversionCountSnapshot = initialCount;
      emitChange();
    }
  }, [initialCount]);

  return count ?? initialCount;
}

export {
  addOptimisticConversion,
  clearOptimisticConversions,
  removeOptimisticConversion,
  replaceOptimisticConversion,
  setConversionSnapshot,
  useOptimisticConversionCount,
  useOptimisticConversions,
};
