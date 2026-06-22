"use client";

import * as React from "react";

function isIOSDevice() {
  return (
    /iPad|iPhone|iPod/i.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

function IOSViewport() {
  React.useEffect(() => {
    if (!isIOSDevice()) {
      return;
    }

    const viewport = document.querySelector<HTMLMetaElement>('meta[name="viewport"]');

    if (!viewport) {
      return;
    }

    const originalContent = viewport.content;
    viewport.content = "width=device-width, initial-scale=1, maximum-scale=1";

    return () => {
      viewport.content = originalContent;
    };
  }, []);

  return null;
}

export { IOSViewport };
