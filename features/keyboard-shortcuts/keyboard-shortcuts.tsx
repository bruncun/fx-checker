"use client";

import * as React from "react";

import { Icon } from "@/components/ui/icon";

type ShortcutAction = () => void;

type KeyboardShortcutContextValue = {
  formatShortcut: (shortcut: ShortcutDefinition) => string;
  openShortcutsDialog: (invoker?: HTMLElement | null) => void;
  registerFocusCurrencySearch: (action: ShortcutAction | null) => void;
  registerHistoryRangeNavigation: (
    actions: {
      nextRange: ShortcutAction;
      previousRange: ShortcutAction;
    } | null
  ) => void;
  registerSwapCurrencies: (action: ShortcutAction | null) => void;
};

type KeyboardShortcutsProviderProps = {
  children: React.ReactNode;
};

type ShortcutDefinition =
  | { key: "ArrowLeft" | "ArrowRight" | "X" }
  | { key: "K" | "/"; modifier: "primary" };

const KeyboardShortcutContext = React.createContext<KeyboardShortcutContextValue | null>(null);

function isEditableElement(element: EventTarget | null) {
  if (!(element instanceof HTMLElement)) {
    return false;
  }

  return (
    element instanceof HTMLInputElement ||
    element instanceof HTMLTextAreaElement ||
    element.isContentEditable
  );
}

function isWithinRangePicker(element: EventTarget | null) {
  return element instanceof HTMLElement && Boolean(element.closest("[data-range-picker]"));
}

function isMacPlatform() {
  return typeof navigator !== "undefined" && /Mac|iPhone|iPad|iPod/.test(navigator.platform);
}

function formatShortcut(shortcut: ShortcutDefinition) {
  if ("modifier" in shortcut) {
    const modifier = isMacPlatform() ? "⌘" : "Ctrl";

    return `${modifier} ${shortcut.key}`;
  }

  if (shortcut.key === "ArrowLeft") {
    return "←";
  }

  if (shortcut.key === "ArrowRight") {
    return "→";
  }

  return shortcut.key;
}

function ShortcutKey({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex min-w-500 items-center justify-center rounded-4 px-125 py-075 text-preset-5 text-neutral-50 shadow-[inset_0_0_0_1px_hsl(var(--neutral-500))]">
      {children}
    </kbd>
  );
}

function KeyboardShortcutsDialog({
  formatShortcut: formatShortcutLabel,
  onClose,
}: {
  formatShortcut: (shortcut: ShortcutDefinition) => string;
  onClose: () => void;
}) {
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
          <button
            ref={closeButtonRef}
            aria-label="Close keyboard shortcuts"
            className="fx-transition-surface flex size-400 shrink-0 items-center justify-center rounded-4 text-preset-4 text-neutral-50 hover:shadow-[inset_0_0_0_1px_hsl(var(--neutral-200))] focus:shadow-[inset_0_0_0_1px_hsl(var(--lime-500))] focus:outline-none"
            onClick={onClose}
            type="button"
          >
            <Icon className="size-200" decorative iconName="close" />
          </button>
        </div>

        <section className="mt-300">
          <h3 className="text-preset-5-medium text-neutral-100 uppercase">Global</h3>
          <dl className="mt-150 grid grid-cols-[auto_1fr] items-center gap-x-200 gap-y-125">
            <ShortcutKey>{formatShortcutLabel({ key: "K", modifier: "primary" })}</ShortcutKey>
            <dd className="text-preset-5 text-neutral-100">Focus currency search</dd>
            <ShortcutKey>{formatShortcutLabel({ key: "X" })}</ShortcutKey>
            <dd className="text-preset-5 text-neutral-100">Swap currencies</dd>
            <ShortcutKey>{formatShortcutLabel({ key: "/", modifier: "primary" })}</ShortcutKey>
            <dd className="text-preset-5 text-neutral-100">Show keyboard shortcuts</dd>
          </dl>
        </section>

        <section className="mt-300">
          <h3 className="text-preset-5-medium text-neutral-100 uppercase">History</h3>
          <p className="mt-075 text-preset-6 text-neutral-200">
            Available while viewing the History tab.
          </p>
          <dl className="mt-150 grid grid-cols-[auto_1fr] items-center gap-x-200 gap-y-125">
            <ShortcutKey>{formatShortcutLabel({ key: "ArrowLeft" })}</ShortcutKey>
            <dd className="text-preset-5 text-neutral-100">Previous range</dd>
            <ShortcutKey>{formatShortcutLabel({ key: "ArrowRight" })}</ShortcutKey>
            <dd className="text-preset-5 text-neutral-100">Next range</dd>
          </dl>
        </section>
      </div>
    </div>
  );
}

function KeyboardShortcutsProvider({ children }: KeyboardShortcutsProviderProps) {
  const focusCurrencySearchRef = React.useRef<ShortcutAction | null>(null);
  const swapCurrenciesRef = React.useRef<ShortcutAction | null>(null);
  const historyRangeNavigationRef = React.useRef<{
    nextRange: ShortcutAction;
    previousRange: ShortcutAction;
  } | null>(null);
  const [isShortcutsDialogOpen, setIsShortcutsDialogOpen] = React.useState(false);
  const dialogInvokerRef = React.useRef<HTMLElement | null>(null);

  const openShortcutsDialog = React.useCallback((invoker?: HTMLElement | null) => {
    dialogInvokerRef.current =
      invoker ?? (document.activeElement instanceof HTMLElement ? document.activeElement : null);
    setIsShortcutsDialogOpen(true);
  }, []);

  const closeShortcutsDialog = React.useCallback(() => {
    setIsShortcutsDialogOpen(false);
    requestAnimationFrame(() => {
      dialogInvokerRef.current?.focus({ preventScroll: true });
    });
  }, []);

  React.useEffect(() => {
    if (!isShortcutsDialogOpen) {
      return;
    }

    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
    };
  }, [isShortcutsDialogOpen]);

  React.useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.defaultPrevented) {
        return;
      }

      if (isShortcutsDialogOpen) {
        if (event.key === "Escape") {
          event.preventDefault();
          closeShortcutsDialog();
        }

        return;
      }

      const key = event.key.toLowerCase();
      const isPrimaryModified = isMacPlatform() ? event.metaKey : event.ctrlKey;

      if (isPrimaryModified && key === "k") {
        event.preventDefault();
        focusCurrencySearchRef.current?.();
        return;
      }

      if (isPrimaryModified && event.key === "/") {
        event.preventDefault();
        openShortcutsDialog();
        return;
      }

      if (key === "x" && !event.metaKey && !event.ctrlKey && !event.altKey) {
        if (isEditableElement(event.target)) {
          return;
        }

        event.preventDefault();
        swapCurrenciesRef.current?.();
        return;
      }

      if (event.key === "ArrowLeft" && historyRangeNavigationRef.current) {
        if (isEditableElement(event.target) || isWithinRangePicker(event.target)) {
          return;
        }

        event.preventDefault();
        historyRangeNavigationRef.current.previousRange();
        return;
      }

      if (event.key === "ArrowRight" && historyRangeNavigationRef.current) {
        if (isEditableElement(event.target) || isWithinRangePicker(event.target)) {
          return;
        }

        event.preventDefault();
        historyRangeNavigationRef.current.nextRange();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [closeShortcutsDialog, isShortcutsDialogOpen, openShortcutsDialog]);

  const contextValue = React.useMemo<KeyboardShortcutContextValue>(
    () => ({
      formatShortcut,
      openShortcutsDialog,
      registerFocusCurrencySearch: (action) => {
        focusCurrencySearchRef.current = action;
      },
      registerHistoryRangeNavigation: (actions) => {
        historyRangeNavigationRef.current = actions;
      },
      registerSwapCurrencies: (action) => {
        swapCurrenciesRef.current = action;
      },
    }),
    [openShortcutsDialog]
  );

  return (
    <KeyboardShortcutContext value={contextValue}>
      {children}
      {isShortcutsDialogOpen ? (
        <KeyboardShortcutsDialog formatShortcut={formatShortcut} onClose={closeShortcutsDialog} />
      ) : null}
    </KeyboardShortcutContext>
  );
}

function useKeyboardShortcuts() {
  const context = React.use(KeyboardShortcutContext);

  if (!context) {
    throw new Error("useKeyboardShortcuts must be used within KeyboardShortcutsProvider");
  }

  return context;
}

function useOptionalKeyboardShortcuts() {
  return React.use(KeyboardShortcutContext);
}

export {
  KeyboardShortcutsProvider,
  useKeyboardShortcuts,
  useOptionalKeyboardShortcuts,
  type ShortcutDefinition,
};
