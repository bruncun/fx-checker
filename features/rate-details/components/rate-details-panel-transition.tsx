"use client";

import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";

import {
  getRateDetailsPanelId,
  getRateDetailsSectionFromPathname,
  getRateDetailsTabId,
} from "./rate-details-navigation-state";

type RateDetailsPanelTransitionProps = {
  children: ReactNode;
};

function RateDetailsPanelTransition({ children }: RateDetailsPanelTransitionProps) {
  const section = getRateDetailsSectionFromPathname(usePathname());
  const contentRef = useRef<HTMLDivElement>(null);
  const lastContentHeightRef = useRef(0);
  const [reservedHeight, setReservedHeight] = useState<number | null>(null);

  useLayoutEffect(() => {
    const content = contentRef.current;

    if (!content) {
      return;
    }

    function syncPanelHeight() {
      if (!content) {
        return;
      }

      const isPending = Boolean(content.querySelector("[data-tab-pending-state]"));

      if (isPending) {
        const previousHeight = lastContentHeightRef.current;

        setReservedHeight(previousHeight > 0 ? previousHeight : null);
        return;
      }

      const nextHeight = Math.ceil(content.getBoundingClientRect().height);

      if (nextHeight > 0) {
        lastContentHeightRef.current = nextHeight;
      }

      setReservedHeight(null);
    }

    syncPanelHeight();

    if (typeof ResizeObserver === "undefined") {
      return;
    }

    const observer = new ResizeObserver(syncPanelHeight);

    observer.observe(content);

    return () => {
      observer.disconnect();
    };
  });

  return (
    <div
      key={section}
      aria-labelledby={getRateDetailsTabId(section)}
      className="fx-tab-panel-in"
      id={getRateDetailsPanelId(section)}
      role="tabpanel"
      style={{ minHeight: reservedHeight ?? undefined }}
    >
      <div ref={contentRef}>{children}</div>
    </div>
  );
}

export { RateDetailsPanelTransition };
