"use client";

import * as React from "react";

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

const LazyKeyboardShortcutsDialog = React.lazy(async () => ({
  default: (await import("./keyboard-shortcuts-dialog")).KeyboardShortcutsDialog,
}));

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

function isWithinLiveRatesScroller(element: EventTarget | null) {
  return (
    element instanceof HTMLElement && Boolean(element.closest("[data-live-rates-scroll-region]"))
  );
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
        if (
          isEditableElement(event.target) ||
          isWithinRangePicker(event.target) ||
          isWithinLiveRatesScroller(event.target)
        ) {
          return;
        }

        event.preventDefault();
        historyRangeNavigationRef.current.previousRange();
        return;
      }

      if (event.key === "ArrowRight" && historyRangeNavigationRef.current) {
        if (
          isEditableElement(event.target) ||
          isWithinRangePicker(event.target) ||
          isWithinLiveRatesScroller(event.target)
        ) {
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
        <React.Suspense fallback={null}>
          <LazyKeyboardShortcutsDialog
            formatShortcut={formatShortcut}
            onClose={closeShortcutsDialog}
          />
        </React.Suspense>
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
