"use client";

import * as React from "react";

import { CurrencyButton } from "@/components/ui/currency-button";
import type { FlagCountryCode } from "@/components/ui/flag";
import { SearchInput } from "@/components/ui/search-input";
import { useOptionalKeyboardShortcuts } from "@/features/keyboard-shortcuts";
import { usePointerDownOutside } from "@/hooks/use-pointer-down-outside";
import { cn } from "@/lib/utils";
import type { CurrencyPickerItem } from "../model/currency-groups";
import { useMobileCurrencyPickerPositioning } from "./use-mobile-currency-picker-positioning";

export type CurrencyPickerContentHandle = {
  handleResultsKeyDown: (event: React.KeyboardEvent<HTMLDivElement>) => boolean;
  handleSearchKeyDown: (event: React.KeyboardEvent<HTMLInputElement>) => boolean;
  runSearchAction: (key: string) => boolean;
};

export type CurrencyPickerContentRenderProps = {
  contentRef: React.RefObject<CurrencyPickerContentHandle | null>;
  currencyCode: string;
  onReady: () => void;
  onSelect: (currency: CurrencyPickerItem) => void;
  resultsRef: React.RefObject<HTMLDivElement | null>;
  searchQuery: string;
  searchRef: React.RefObject<HTMLInputElement | null>;
  setSearchQuery: React.Dispatch<React.SetStateAction<string>>;
};

export type CurrencyPickerShellHandle = {
  focusSearch: () => void;
  focusTrigger: () => void;
};

export interface CurrencyPickerShellProps {
  className?: string;
  countryCode: FlagCountryCode;
  currencyCode: string;
  flagFetchPriority?: React.ComponentProps<typeof CurrencyButton>["flagFetchPriority"];
  flagLoading?: React.ComponentProps<typeof CurrencyButton>["flagLoading"];
  focusSearchRequest?: number;
  focusTriggerRequest?: number;
  openRequest?: number;
  ref?: React.Ref<CurrencyPickerShellHandle>;
  renderContent: (props: CurrencyPickerContentRenderProps) => React.ReactNode;
  onPickerOpen?: () => void;
  onPrepare?: () => void;
  onCurrencySelect?: (currency: CurrencyPickerItem) => void;
  left?: boolean;
}

function CurrencyPickerShell({
  className,
  countryCode,
  currencyCode,
  flagFetchPriority,
  flagLoading,
  focusSearchRequest = 0,
  focusTriggerRequest = 0,
  openRequest = 0,
  ref,
  renderContent,
  onPickerOpen,
  onPrepare,
  onCurrencySelect,
  left = false,
}: CurrencyPickerShellProps) {
  const shortcuts = useOptionalKeyboardShortcuts();
  const [isOpen, setIsOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const panelId = React.useId();
  const resultsId = React.useId();
  const contentRef = React.useRef<CurrencyPickerContentHandle>(null);
  const pendingSearchActionRef = React.useRef<string | null>(null);
  const rootRef = React.useRef<HTMLDivElement>(null);
  const panelRef = React.useRef<HTMLDivElement>(null);
  const resultsRef = React.useRef<HTMLDivElement>(null);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const searchRef = React.useRef<HTMLInputElement>(null);
  const { scrollTriggerIntoMobilePosition, updateAvailableHeight } =
    useMobileCurrencyPickerPositioning({
      isOpen,
      panelRef,
      resultsRef,
      rootRef,
      triggerRef,
    });

  function focusSearchInput() {
    searchRef.current?.focus({ preventScroll: true });
    searchRef.current?.select();
  }

  function openPicker() {
    onPrepare?.();
    setSearchQuery("");
    setIsOpen(true);
    onPickerOpen?.();
  }

  function openPickerFromTrigger() {
    scrollTriggerIntoMobilePosition();
    openPicker();
  }

  function focusSearch() {
    if (!isOpen) {
      openPicker();
      return;
    }

    requestAnimationFrame(() => {
      focusSearchInput();
    });
  }

  function focusTrigger() {
    triggerRef.current?.focus({ preventScroll: true });
  }

  React.useImperativeHandle(ref, () => ({ focusSearch, focusTrigger }));

  const openPickerFromTriggerRef = React.useRef(openPickerFromTrigger);
  const focusSearchRef = React.useRef(focusSearch);
  const focusTriggerRef = React.useRef(focusTrigger);

  React.useEffect(() => {
    openPickerFromTriggerRef.current = openPickerFromTrigger;
    focusSearchRef.current = focusSearch;
    focusTriggerRef.current = focusTrigger;
  });

  React.useEffect(() => {
    if (openRequest === 0) {
      return;
    }

    const animationFrameId = requestAnimationFrame(() => {
      openPickerFromTriggerRef.current();
    });

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [openRequest]);

  React.useEffect(() => {
    if (focusSearchRequest === 0) {
      return;
    }

    const animationFrameId = requestAnimationFrame(() => {
      focusSearchRef.current();
    });

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [focusSearchRequest]);

  React.useEffect(() => {
    if (focusTriggerRequest === 0) {
      return;
    }

    const animationFrameId = requestAnimationFrame(() => {
      focusTriggerRef.current();
    });

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [focusTriggerRequest]);

  function closePicker(options?: { restoreFocus?: boolean }) {
    setIsOpen(false);

    if (options?.restoreFocus ?? true) {
      requestAnimationFrame(() => {
        triggerRef.current?.focus();
      });
    }
  }

  React.useLayoutEffect(() => {
    if (!isOpen) {
      return;
    }

    // This must remain synchronous with the opening commit. In particular, mobile
    // browsers need the real search input focused while the click still owns the
    // user activation so the visual viewport and software keyboard are correct.
    focusSearchInput();
    updateAvailableHeight();
  }, [isOpen, updateAvailableHeight]);

  usePointerDownOutside({
    enabled: isOpen,
    onPointerDownOutside: () => {
      closePicker({ restoreFocus: false });
    },
    ref: rootRef,
  });

  return (
    <div
      ref={rootRef}
      className={cn("relative inline-flex shrink-0", isOpen ? "z-[120]" : "z-[70]", className)}
    >
      <CurrencyButton
        ref={triggerRef}
        aria-controls={isOpen ? panelId : undefined}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        aria-label={currencyCode}
        countryCode={countryCode}
        currencyCode={currencyCode}
        flagFetchPriority={flagFetchPriority}
        flagLoading={flagLoading}
        onClick={() => {
          if (isOpen) {
            closePicker({ restoreFocus: false });
          } else {
            openPickerFromTrigger();
          }
        }}
        onFocus={onPrepare}
        onKeyDown={(event) => {
          if (!isOpen && (event.key === "ArrowDown" || event.key === "ArrowUp")) {
            event.preventDefault();
            openPickerFromTrigger();
          }
        }}
        onPointerDown={onPrepare}
        onPointerEnter={onPrepare}
      />

      {isOpen ? (
        <div
          ref={panelRef}
          aria-label="Currency picker"
          aria-modal="true"
          className={cn(
            "fx-panel-in absolute top-[calc(100%+20px)] right-[-16px] z-[100] flex max-h-[min(458px,var(--currency-picker-available-height,458px),calc(100svh_-_var(--currency-picker-panel-top,0px)_-_16px_-_env(safe-area-inset-bottom,0px)))] w-[min(calc(100vw-64px),472px)] max-w-[376px] flex-col overflow-hidden rounded-10 bg-neutral-600 pt-100 shadow-[inset_0_0_0_1px_hsl(var(--neutral-400)),var(--shadow-elevation-popover)] sm:top-[calc(100%+9.5px)] sm:max-h-[466px] sm:py-100 lg:right-0 lg:left-auto",
            left ? "sm:left-0" : "sm:right-0"
          )}
          id={panelId}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              event.preventDefault();
              closePicker();
              return;
            }

            contentRef.current?.handleResultsKeyDown(event);
          }}
          role="dialog"
        >
          <SearchInput
            ref={searchRef}
            aria-controls={resultsId}
            aria-expanded={isOpen}
            className="mx-100 mb-125 shrink-0"
            inputClassName="origin-left scale-75 text-[16px] leading-[1.2]"
            onChange={(event) => {
              setSearchQuery(event.currentTarget.value);
            }}
            onKeyDown={(event) => {
              const content = contentRef.current;

              if (content?.handleSearchKeyDown(event)) {
                event.stopPropagation();
                return;
              }

              if (!content && ["ArrowDown", "ArrowUp", "Enter", "Tab"].includes(event.key)) {
                event.preventDefault();
                event.stopPropagation();
                pendingSearchActionRef.current = event.key;
              }
            }}
            shortcutBadge={shortcuts?.formatShortcut({ key: "K", modifier: "primary" }) ?? "Ctrl K"}
            value={searchQuery}
          />

          <div
            ref={resultsRef}
            aria-label="Currency results"
            className="flex min-h-0 flex-1 flex-col gap-025 overflow-y-auto overscroll-contain"
            data-currency-results-scroll
            data-test-id="currency-results"
            id={resultsId}
          >
            {renderContent({
              contentRef,
              currencyCode,
              onReady: () => {
                const pendingSearchAction = pendingSearchActionRef.current;

                if (pendingSearchAction) {
                  pendingSearchActionRef.current = null;
                  contentRef.current?.runSearchAction(pendingSearchAction);
                }
              },
              onSelect: (currency) => {
                onCurrencySelect?.(currency);
                closePicker();
              },
              resultsRef,
              searchQuery,
              searchRef,
              setSearchQuery,
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export { CurrencyPickerShell };
