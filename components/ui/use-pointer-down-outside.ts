"use client";

import * as React from "react";

type UsePointerDownOutsideOptions<TElement extends HTMLElement> = {
  enabled: boolean;
  onPointerDownOutside: () => void;
  ref: React.RefObject<TElement | null>;
};

function usePointerDownOutside<TElement extends HTMLElement>({
  enabled,
  onPointerDownOutside,
  ref,
}: UsePointerDownOutsideOptions<TElement>) {
  React.useEffect(() => {
    if (!enabled) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      const element = ref.current;

      if (!element || element.contains(event.target as Node)) {
        return;
      }

      onPointerDownOutside();
    }

    document.addEventListener("pointerdown", handlePointerDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [enabled, onPointerDownOutside, ref]);
}

export { usePointerDownOutside };
