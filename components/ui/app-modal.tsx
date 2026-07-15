"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import { CloseButton } from "./close-button";

type AppModalProps = {
  children: React.ReactNode;
  className?: string;
  closeLabel: string;
  initialFocus?: "close" | "first";
  onClose: () => void;
  title: string;
};

const focusableSelector =
  'button, [href], input, textarea, select, [tabindex]:not([tabindex="-1"])';

function getFocusableElements(dialog: HTMLElement | null) {
  return Array.from(dialog?.querySelectorAll<HTMLElement>(focusableSelector) ?? []).filter(
    (element) => !element.hasAttribute("disabled")
  );
}

function AppModal({
  children,
  className,
  closeLabel,
  initialFocus = "close",
  onClose,
  title,
}: AppModalProps) {
  const closeButtonRef = React.useRef<HTMLButtonElement>(null);
  const dialogRef = React.useRef<HTMLDivElement>(null);
  const invokerRef = React.useRef<HTMLElement | null>(null);
  const titleId = React.useId();

  React.useLayoutEffect(() => {
    invokerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;

    if (initialFocus === "first") {
      const firstFocusable = getFocusableElements(dialogRef.current).find(
        (element) => element !== closeButtonRef.current
      );
      firstFocusable?.focus({ preventScroll: true });
      return;
    }

    closeButtonRef.current?.focus({ preventScroll: true });
  }, [initialFocus]);

  React.useEffect(() => {
    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
      requestAnimationFrame(() => {
        invokerRef.current?.focus({ preventScroll: true });
      });
    };
  }, []);

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      onClose();
      return;
    }

    if (event.key !== "Tab") {
      return;
    }

    event.preventDefault();

    const focusableElements = getFocusableElements(dialogRef.current);
    const firstElement = focusableElements[0];
    const lastElement = focusableElements.at(-1);

    if (!firstElement || !lastElement) {
      return;
    }

    const currentIndex = focusableElements.findIndex((element) => element === document.activeElement);

    if (event.shiftKey && document.activeElement === firstElement) {
      lastElement.focus();
    } else if (!event.shiftKey && document.activeElement === lastElement) {
      firstElement.focus();
    } else if (currentIndex >= 0) {
      const nextIndex = event.shiftKey ? currentIndex - 1 : currentIndex + 1;
      focusableElements[nextIndex]?.focus();
    } else {
      firstElement.focus();
    }
  }

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-neutral-50/35 px-200 py-400 dark:bg-neutral-900/70"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
      onPointerDown={(event) => {
        event.stopPropagation();
      }}
    >
      <div
        ref={dialogRef}
        aria-labelledby={titleId}
        aria-modal="true"
        className={cn(
          "fx-panel-in flex max-h-[calc(100svh-64px)] w-full max-w-[420px] flex-col overflow-y-auto rounded-10 bg-neutral-600 p-250 text-neutral-50 shadow-[inset_0_0_0_1px_hsl(var(--neutral-400)),var(--shadow-elevation-popover)] sm:max-h-[calc(100svh-96px)]",
          className
        )}
        onKeyDown={handleKeyDown}
        role="dialog"
      >
        <div className="flex items-center justify-between gap-200">
          <h2 id={titleId} className="text-preset-3 text-neutral-50 uppercase">
            {title}
          </h2>
          <CloseButton ref={closeButtonRef} aria-label={closeLabel} onClick={onClose} />
        </div>
        {children}
      </div>
    </div>
  );
}

export { AppModal };
