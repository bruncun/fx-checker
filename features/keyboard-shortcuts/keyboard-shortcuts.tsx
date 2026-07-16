"use client";

import * as React from "react";

type ShortcutAction = () => void;

type KeyboardShortcutContextValue = {
  formatShortcut: (shortcut: ShortcutDefinition) => string;
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
  | { key: "K"; modifier: "primary" };

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

  React.useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.defaultPrevented) {
        return;
      }

      const key = event.key.toLowerCase();
      const isPrimaryModified = isMacPlatform() ? event.metaKey : event.ctrlKey;

      if (isPrimaryModified && key === "k") {
        event.preventDefault();
        focusCurrencySearchRef.current?.();
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
  }, []);

  const contextValue = React.useMemo<KeyboardShortcutContextValue>(
    () => ({
      formatShortcut,
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
    []
  );

  return (
    <KeyboardShortcutContext value={contextValue}>
      {children}
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
