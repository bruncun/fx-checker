"use client";

import * as React from "react";

type RovingFocusOrientation = "horizontal" | "vertical";
type RovingFocusKey = "ArrowDown" | "ArrowLeft" | "ArrowRight" | "ArrowUp" | "End" | "Home";

const rovingFocusKeys: RovingFocusKey[] = [
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "ArrowUp",
  "End",
  "Home",
];

function isRovingFocusKey(key: string): key is RovingFocusKey {
  return rovingFocusKeys.includes(key as RovingFocusKey);
}

function getNextRovingFocusIndex({
  currentIndex,
  itemCount,
  key,
  orientation,
  wrap,
}: {
  currentIndex: number;
  itemCount: number;
  key: RovingFocusKey;
  orientation: RovingFocusOrientation;
  wrap: boolean;
}) {
  if (key === "Home") {
    return 0;
  }

  if (key === "End") {
    return itemCount - 1;
  }

  const isNextKey =
    (orientation === "horizontal" && key === "ArrowRight") ||
    (orientation === "vertical" && key === "ArrowDown");
  const isPreviousKey =
    (orientation === "horizontal" && key === "ArrowLeft") ||
    (orientation === "vertical" && key === "ArrowUp");

  if (!isNextKey && !isPreviousKey) {
    return currentIndex;
  }

  const nextIndex = isNextKey ? currentIndex + 1 : currentIndex - 1;

  if (wrap) {
    return (nextIndex + itemCount) % itemCount;
  }

  return Math.min(Math.max(nextIndex, 0), itemCount - 1);
}

type UseRovingTabIndexOptions<TItem extends HTMLElement> = {
  containerRef: React.RefObject<HTMLElement | null>;
  itemSelector: string;
  onCurrentElementChange?: (element: TItem) => void;
  orientation: RovingFocusOrientation;
  wrap?: boolean;
};

export function useRovingTabIndex<TItem extends HTMLElement>({
  containerRef,
  itemSelector,
  onCurrentElementChange,
  orientation,
  wrap = true,
}: UseRovingTabIndexOptions<TItem>) {
  function getItems() {
    return Array.from(containerRef.current?.querySelectorAll<TItem>(itemSelector) ?? []);
  }

  function focusItem(item: TItem | undefined) {
    if (!item) {
      return;
    }

    const items = getItems();

    items.forEach((currentItem) => {
      currentItem.tabIndex = currentItem === item ? 0 : -1;
    });
    onCurrentElementChange?.(item);
    item.focus({ preventScroll: true });
    item.scrollIntoView?.({ block: "nearest", inline: "nearest" });
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLElement>) {
    if (!isRovingFocusKey(event.key)) {
      return false;
    }

    const items = getItems();
    const currentIndex = items.findIndex((item) => item === document.activeElement);

    if (currentIndex === -1 || items.length === 0) {
      return false;
    }

    const nextIndex = getNextRovingFocusIndex({
      currentIndex,
      itemCount: items.length,
      key: event.key,
      orientation,
      wrap,
    });

    if (nextIndex === currentIndex) {
      return false;
    }

    event.preventDefault();
    focusItem(items[nextIndex]);
    return true;
  }

  return {
    focusItem,
    getItems,
    handleKeyDown,
  };
}
