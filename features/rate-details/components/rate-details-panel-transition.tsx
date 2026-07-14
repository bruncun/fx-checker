"use client";

import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";

import {
  getRateDetailsPanelId,
  getRateDetailsSectionFromPathname,
  getRateDetailsTabId,
} from "./rate-details-navigation-state";

const panelHeightTransitionMs = 160;

type RateDetailsPanelTransitionProps = {
  children: ReactNode;
};

function RateDetailsPanelTransition({ children }: RateDetailsPanelTransitionProps) {
  const section = getRateDetailsSectionFromPathname(usePathname());
  const contentRef = useRef<HTMLDivElement>(null);
  const releaseReservedHeightTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reservedHeightAnimationFrameRef = useRef<number | null>(null);
  const [lastSettledPanel, setLastSettledPanel] = useState({ height: 0, section });
  const [reservedHeight, setReservedHeight] = useState<number | null>(null);
  const sectionChanged = lastSettledPanel.section !== section;
  const renderedReservedHeight =
    reservedHeight ?? (sectionChanged ? lastSettledPanel.height || null : null);

  useLayoutEffect(() => {
    const content = contentRef.current;

    if (!content) {
      return;
    }

    const didSectionChange = lastSettledPanel.section !== section;
    const previousSectionHeight = lastSettledPanel.height;

    function clearReleaseReservedHeightTimeout() {
      if (!releaseReservedHeightTimeoutRef.current) {
        return;
      }

      clearTimeout(releaseReservedHeightTimeoutRef.current);
      releaseReservedHeightTimeoutRef.current = null;
    }

    function clearReservedHeightAnimationFrame() {
      if (!reservedHeightAnimationFrameRef.current) {
        return;
      }

      cancelAnimationFrame(reservedHeightAnimationFrameRef.current);
      reservedHeightAnimationFrameRef.current = null;
    }

    function releaseReservedHeightAfterTransition() {
      if (releaseReservedHeightTimeoutRef.current) {
        return;
      }

      releaseReservedHeightTimeoutRef.current = setTimeout(() => {
        releaseReservedHeightTimeoutRef.current = null;
        setReservedHeight(null);
      }, panelHeightTransitionMs);
    }

    function updateLastSettledPanel(nextHeight: number) {
      if (nextHeight <= 0) {
        return;
      }

      setLastSettledPanel((currentPanel) =>
        currentPanel.section === section && currentPanel.height === nextHeight
          ? currentPanel
          : { height: nextHeight, section }
      );
    }

    function syncPanelHeight() {
      if (!content) {
        return;
      }

      const isPending = Boolean(content.querySelector("[data-tab-pending-state]"));
      const shouldReduceMotion =
        typeof window.matchMedia === "function" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      if (isPending) {
        clearReservedHeightAnimationFrame();
        clearReleaseReservedHeightTimeout();

        const previousHeight = lastSettledPanel.height;

        setReservedHeight(previousHeight > 0 ? previousHeight : null);
        return;
      }

      const nextHeight = Math.ceil(content.getBoundingClientRect().height);

      if (didSectionChange && reservedHeight === null) {
        if (
          shouldReduceMotion ||
          previousSectionHeight <= 0 ||
          nextHeight >= previousSectionHeight
        ) {
          updateLastSettledPanel(nextHeight);
          clearReservedHeightAnimationFrame();
          clearReleaseReservedHeightTimeout();
          setReservedHeight(null);
          return;
        }

        clearReservedHeightAnimationFrame();
        clearReleaseReservedHeightTimeout();

        reservedHeightAnimationFrameRef.current = requestAnimationFrame(() => {
          reservedHeightAnimationFrameRef.current = null;
          updateLastSettledPanel(nextHeight);
          setReservedHeight(nextHeight);
        });
        return;
      }

      updateLastSettledPanel(nextHeight);

      if (reservedHeight !== null) {
        if (shouldReduceMotion || nextHeight > reservedHeight) {
          clearReservedHeightAnimationFrame();
          clearReleaseReservedHeightTimeout();
          setReservedHeight(null);
          return;
        }

        if (nextHeight !== reservedHeight) {
          setReservedHeight(nextHeight);
        }

        releaseReservedHeightAfterTransition();
        return;
      }

      setReservedHeight(null);
    }

    syncPanelHeight();

    const observer =
      typeof ResizeObserver === "undefined" ? null : new ResizeObserver(syncPanelHeight);

    observer?.observe(content);

    return () => {
      observer?.disconnect();
      clearReservedHeightAnimationFrame();
      clearReleaseReservedHeightTimeout();
    };
  });

  return (
    <div
      key={section}
      aria-labelledby={getRateDetailsTabId(section)}
      className="fx-tab-panel-in fx-transition-layout"
      id={getRateDetailsPanelId(section)}
      role="tabpanel"
      style={{ minHeight: renderedReservedHeight ?? undefined }}
    >
      <div ref={contentRef}>{children}</div>
    </div>
  );
}

export { RateDetailsPanelTransition };
