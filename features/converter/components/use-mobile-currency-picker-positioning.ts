"use client";

import * as React from "react";

const panelViewportGutter = 16;
const mobilePanelGap = 20;
const mobilePanelMinimumVisibleHeight = 111;
const mobilePickerScrollAnimationMs = 240;
const mobileTriggerIdealTop = 52;

function isCoarsePointer() {
  return window.matchMedia?.("(pointer: coarse)").matches ?? false;
}

function prefersReducedMotion() {
  return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
}

function getLockedBodyScrollY() {
  const top = Number.parseFloat(document.body.style.top);

  return Number.isFinite(top) && top < 0 ? Math.abs(top) : window.scrollY;
}

type UseMobileCurrencyPickerPositioningProps = {
  isOpen: boolean;
  panelRef: React.RefObject<HTMLDivElement | null>;
  resultsRef: React.RefObject<HTMLDivElement | null>;
  rootRef: React.RefObject<HTMLDivElement | null>;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
};

function useMobileCurrencyPickerPositioning({
  isOpen,
  panelRef,
  resultsRef,
  rootRef,
  triggerRef,
}: UseMobileCurrencyPickerPositioningProps) {
  const mobilePickerInitialScrollYRef = React.useRef<number | null>(null);
  const mobilePickerScrollYRef = React.useRef<number | null>(null);
  const mobilePickerShouldAnimateRef = React.useRef(false);

  const updateAvailableHeight = React.useCallback(() => {
    const panel = panelRef.current;

    if (!panel) {
      return;
    }

    const visualViewport = window.visualViewport;
    const rootTop = rootRef.current?.getBoundingClientRect().top ?? 0;
    const panelTop = rootTop + panel.offsetTop;
    const isWebKit = typeof CSS !== "undefined" && CSS.supports("-webkit-backdrop-filter", "none");
    const viewportBottom = visualViewport
      ? visualViewport.height + (isWebKit ? 0 : visualViewport.offsetTop)
      : window.innerHeight;
    const availableHeight = Math.max(
      0,
      Math.floor(viewportBottom - panelTop - panelViewportGutter)
    );

    panel.style.setProperty("--currency-picker-available-height", `${availableHeight}px`);
    panel.style.setProperty("--currency-picker-panel-top", `${Math.max(0, panelTop)}px`);
  }, [panelRef, rootRef]);

  function getMobileScrollTarget() {
    const trigger = triggerRef.current;
    const root = rootRef.current;

    if (!trigger || !root || !isCoarsePointer()) {
      return null;
    }

    const visualViewport = window.visualViewport;
    const viewportTop = visualViewport?.offsetTop ?? 0;
    const viewportHeight = visualViewport?.height ?? window.innerHeight;
    const triggerRect = trigger.getBoundingClientRect();
    const triggerViewportTop = triggerRect.top - viewportTop;
    const panelViewportTop = triggerRect.bottom - viewportTop + mobilePanelGap;
    const panelOverflow =
      panelViewportTop + mobilePanelMinimumVisibleHeight + panelViewportGutter - viewportHeight;
    const triggerOverflow = triggerViewportTop - mobileTriggerIdealTop;
    const scrollDistance = Math.max(0, triggerOverflow, panelOverflow);

    if (scrollDistance <= 1) {
      return null;
    }

    const nextScrollY = Math.max(0, window.scrollY + scrollDistance);

    return Math.abs(nextScrollY - window.scrollY) > 1 ? nextScrollY : null;
  }

  function scrollTriggerIntoMobilePosition() {
    const nextScrollY = getMobileScrollTarget();
    const currentScrollY = window.scrollY;

    mobilePickerInitialScrollYRef.current = currentScrollY;
    if (nextScrollY === null) {
      mobilePickerScrollYRef.current = currentScrollY;
      mobilePickerShouldAnimateRef.current = false;
      return false;
    }

    mobilePickerScrollYRef.current = nextScrollY;
    mobilePickerShouldAnimateRef.current = !prefersReducedMotion();

    return true;
  }

  React.useLayoutEffect(() => {
    if (!isOpen) {
      return;
    }

    const panel = panelRef.current;

    if (!panel) {
      return;
    }

    updateAvailableHeight();
    window.addEventListener("resize", updateAvailableHeight);
    window.addEventListener("scroll", updateAvailableHeight, true);
    window.visualViewport?.addEventListener("resize", updateAvailableHeight);
    window.visualViewport?.addEventListener("scroll", updateAvailableHeight);

    return () => {
      window.removeEventListener("resize", updateAvailableHeight);
      window.removeEventListener("scroll", updateAvailableHeight, true);
      window.visualViewport?.removeEventListener("resize", updateAvailableHeight);
      window.visualViewport?.removeEventListener("scroll", updateAvailableHeight);
    };
  }, [isOpen, panelRef, updateAvailableHeight]);

  React.useLayoutEffect(() => {
    const panel = panelRef.current;
    const results = resultsRef.current;

    if (!isOpen || !panel || !results) {
      return;
    }

    let lastTouchY = 0;

    const handleTouchStart = (event: TouchEvent) => {
      lastTouchY = event.touches[0]?.clientY ?? 0;
    };

    const handleTouchMove = (event: TouchEvent) => {
      const touch = event.touches[0];
      const target = event.target;

      if (!touch || !(target instanceof Node)) {
        return;
      }

      if (!panel.contains(target)) {
        return;
      }

      const deltaY = lastTouchY - touch.clientY;
      lastTouchY = touch.clientY;

      if (!results.contains(target)) {
        event.preventDefault();
        return;
      }

      const canScrollResults = results.scrollHeight > results.clientHeight;

      if (!canScrollResults) {
        event.preventDefault();
        return;
      }

      const isScrollingPastTop = results.scrollTop <= 0 && deltaY < 0;
      const isScrollingPastBottom =
        Math.ceil(results.scrollTop + results.clientHeight) >= results.scrollHeight && deltaY > 0;

      if (isScrollingPastTop || isScrollingPastBottom) {
        event.preventDefault();
      }
    };

    document.addEventListener("touchstart", handleTouchStart, { passive: true });
    document.addEventListener("touchmove", handleTouchMove, { passive: false });

    return () => {
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchmove", handleTouchMove);
    };
  }, [isOpen, panelRef, resultsRef]);

  React.useLayoutEffect(() => {
    if (!isOpen || !isCoarsePointer()) {
      return;
    }

    const initialScrollY = mobilePickerInitialScrollYRef.current ?? window.scrollY;
    const scrollY = mobilePickerScrollYRef.current ?? initialScrollY;
    const shouldAnimate = mobilePickerShouldAnimateRef.current;
    let animationFrameId = 0;

    mobilePickerInitialScrollYRef.current = null;
    mobilePickerScrollYRef.current = null;
    mobilePickerShouldAnimateRef.current = false;

    const bodyStyle = document.body.style;
    const previousPosition = bodyStyle.position;
    const previousTop = bodyStyle.top;
    const previousWidth = bodyStyle.width;
    const previousOverflow = bodyStyle.overflow;

    bodyStyle.position = "fixed";
    bodyStyle.top = `-${initialScrollY}px`;
    bodyStyle.width = "100%";
    bodyStyle.overflow = "hidden";
    updateAvailableHeight();

    if (!shouldAnimate || Math.abs(scrollY - initialScrollY) <= 1) {
      bodyStyle.top = `-${scrollY}px`;
      updateAvailableHeight();
    } else {
      const startedAt = performance.now();
      const animateBodyOffset = (timestamp: number) => {
        const progress = Math.min(1, (timestamp - startedAt) / mobilePickerScrollAnimationMs);
        const easedProgress = 1 - (1 - progress) ** 3;
        const nextScrollY = initialScrollY + (scrollY - initialScrollY) * easedProgress;

        bodyStyle.top = `-${nextScrollY}px`;
        updateAvailableHeight();

        if (progress < 1) {
          animationFrameId = requestAnimationFrame(animateBodyOffset);
        }
      };

      animationFrameId = requestAnimationFrame(animateBodyOffset);
    }

    return () => {
      const lockedScrollY = getLockedBodyScrollY();

      if (animationFrameId !== 0) {
        cancelAnimationFrame(animationFrameId);
      }

      bodyStyle.position = previousPosition;
      bodyStyle.top = previousTop;
      bodyStyle.width = previousWidth;
      bodyStyle.overflow = previousOverflow;
      window.scrollTo({ top: lockedScrollY, behavior: "auto" });
    };
  }, [isOpen, updateAvailableHeight]);

  return {
    scrollTriggerIntoMobilePosition,
    updateAvailableHeight,
  };
}

export { useMobileCurrencyPickerPositioning };
