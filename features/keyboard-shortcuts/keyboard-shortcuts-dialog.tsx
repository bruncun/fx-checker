"use client";

import * as React from "react";

import { CloseButton } from "@/components/ui/close-button";
import type { ShortcutDefinition } from "./keyboard-shortcuts";

type KeyboardShortcutsDialogProps = {
  formatShortcut: (shortcut: ShortcutDefinition) => string;
  onClose: () => void;
};

function ShortcutKey({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex min-w-500 items-center justify-center rounded-4 px-125 py-075 text-preset-5 text-neutral-50 shadow-[inset_0_0_0_1px_hsl(var(--neutral-500))]">
      {children}
    </kbd>
  );
}

function KeyboardShortcutsDialog({ formatShortcut, onClose }: KeyboardShortcutsDialogProps) {
  const closeButtonRef = React.useRef<HTMLButtonElement>(null);
  const dialogRef = React.useRef<HTMLDivElement>(null);
  const titleId = React.useId();

  React.useLayoutEffect(() => {
    closeButtonRef.current?.focus({ preventScroll: true });
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

    const focusableElements = Array.from(
      dialogRef.current?.querySelectorAll<HTMLElement>(
        'button, [href], input, textarea, select, [tabindex]:not([tabindex="-1"])'
      ) ?? []
    ).filter((element) => !element.hasAttribute("disabled"));
    const firstElement = focusableElements[0];
    const lastElement = focusableElements.at(-1);

    if (!firstElement || !lastElement) {
      return;
    }

    if (event.shiftKey && document.activeElement === firstElement) {
      lastElement.focus();
    } else if (!event.shiftKey && document.activeElement === lastElement) {
      firstElement.focus();
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
        className="fx-panel-in flex max-h-[calc(100svh-64px)] flex-col overflow-y-auto rounded-10 bg-neutral-600 p-250 text-neutral-50 shadow-[inset_0_0_0_1px_hsl(var(--neutral-400)),var(--shadow-elevation-popover)] sm:max-h-[calc(100svh-96px)]"
        onKeyDown={handleKeyDown}
        role="dialog"
      >
        <div className="flex items-center justify-between gap-200">
          <h2 id={titleId} className="text-preset-3 text-neutral-50 uppercase">
            Keyboard Shortcuts
          </h2>
          <CloseButton
            ref={closeButtonRef}
            aria-label="Close keyboard shortcuts"
            onClick={onClose}
          />
        </div>

        <section className="mt-300">
          <h3 className="text-preset-5-medium text-neutral-100 uppercase">Global</h3>
          <dl className="mt-150 grid grid-cols-[auto_1fr] items-center gap-x-200 gap-y-125">
            <ShortcutKey>{formatShortcut({ key: "K", modifier: "primary" })}</ShortcutKey>
            <dd className="text-preset-5 text-neutral-100">Focus currency search</dd>
            <ShortcutKey>{formatShortcut({ key: "X" })}</ShortcutKey>
            <dd className="text-preset-5 text-neutral-100">Swap currencies</dd>
            <ShortcutKey>{formatShortcut({ key: "/", modifier: "primary" })}</ShortcutKey>
            <dd className="text-preset-5 text-neutral-100">Show keyboard shortcuts</dd>
          </dl>
        </section>

        <section className="mt-300">
          <h3 className="text-preset-5-medium text-neutral-100 uppercase">History</h3>
          <dl className="mt-150 grid grid-cols-[auto_1fr] items-center gap-x-200 gap-y-125">
            <ShortcutKey>{formatShortcut({ key: "ArrowLeft" })}</ShortcutKey>
            <dd className="text-preset-5 text-neutral-100">Previous range</dd>
            <ShortcutKey>{formatShortcut({ key: "ArrowRight" })}</ShortcutKey>
            <dd className="text-preset-5 text-neutral-100">Next range</dd>
          </dl>
        </section>
      </div>
    </div>
  );
}

export { KeyboardShortcutsDialog };
