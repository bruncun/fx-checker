"use client";

const CONVERTER_VISIBLE_RATIO_THRESHOLD = 0.6;

function getVisibleRatio(element: Element) {
  const rect = element.getBoundingClientRect();
  const visualViewportHeight = window.visualViewport?.height ?? 0;
  const viewportHeight = visualViewportHeight > 0 ? visualViewportHeight : window.innerHeight;

  if (rect.height <= 0 || viewportHeight <= 0) {
    return 0;
  }

  const visibleHeight = Math.min(rect.bottom, viewportHeight) - Math.max(rect.top, 0);

  return Math.max(0, Math.min(visibleHeight, rect.height)) / rect.height;
}

function scrollConverterIntoViewIfNeeded() {
  const converter = document.getElementById("converter");

  if (!converter || getVisibleRatio(converter) >= CONVERTER_VISIBLE_RATIO_THRESHOLD) {
    return;
  }

  const behavior = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
    ? "auto"
    : "smooth";

  converter.scrollIntoView?.({ behavior, block: "start" });
}

export { scrollConverterIntoViewIfNeeded };
