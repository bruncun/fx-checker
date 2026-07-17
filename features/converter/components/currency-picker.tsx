"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import { CurrencyButton } from "@/components/ui/currency-button";
import type { FlagCountryCode } from "@/components/ui/flag";
import { SearchInput } from "@/components/ui/search-input";
import { useOptionalKeyboardShortcuts } from "@/features/keyboard-shortcuts";
import { usePointerDownOutside } from "@/hooks/use-pointer-down-outside";
import { useRovingTabIndex } from "@/hooks/use-roving-tabindex";
import type { AvailableCurrency } from "../model/currencies";
import { getCurrencyGroups, type CurrencyPickerItem } from "../model/currency-groups";
import { CurrencyItem } from "./currency-picker-item";
import { useMobileCurrencyPickerPositioning } from "./use-mobile-currency-picker-positioning";

function isPrintableSearchKey(event: React.KeyboardEvent) {
  return (
    event.key.length === 1 && event.key !== " " && !event.altKey && !event.ctrlKey && !event.metaKey
  );
}

export interface CurrencyPickerProps {
  className?: string;
  countryCode: FlagCountryCode;
  currencies: AvailableCurrency[];
  currencyCode: string;
  flagFetchPriority?: React.ComponentProps<typeof CurrencyButton>["flagFetchPriority"];
  flagLoading?: React.ComponentProps<typeof CurrencyButton>["flagLoading"];
  focusSearchRequest?: number;
  focusTriggerRequest?: number;
  openRequest?: number;
  ref?: React.Ref<CurrencyPickerHandle>;
  onPickerOpen?: () => void;
  onCurrencySelect?: (currency: CurrencyPickerItem) => void;
  left?: boolean;
}

export type CurrencyPickerWithDataProps = Omit<CurrencyPickerProps, "currencies"> & {
  currenciesPromise: Promise<AvailableCurrency[]>;
};

export type CurrencyPickerHandle = {
  focusSearch: () => void;
  focusTrigger: () => void;
};

function CurrencyPicker({
  className,
  countryCode,
  currencies,
  currencyCode,
  flagFetchPriority,
  flagLoading,
  focusSearchRequest = 0,
  focusTriggerRequest = 0,
  openRequest = 0,
  ref,
  onPickerOpen,
  onCurrencySelect,
  left = false,
}: CurrencyPickerProps) {
  const shortcuts = useOptionalKeyboardShortcuts();
  const [isOpen, setIsOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [activeCurrencyCode, setActiveCurrencyCode] = React.useState(currencyCode);
  const panelId = React.useId();
  const resultsId = React.useId();
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
  const rovingFocus = useRovingTabIndex<HTMLButtonElement>({
    containerRef: panelRef,
    itemSelector: "[data-currency-option]",
    onCurrentElementChange: (button) => {
      setActiveCurrencyCode(button.dataset.currencyCode ?? "");
    },
    orientation: "vertical",
  });
  const currencyGroups = getCurrencyGroups(currencies);

  const selectedCurrency =
    currencyGroups
      .flatMap((group) => group.currencies)
      .find((currency) => currency.code === currencyCode) ?? null;
  const normalizedQuery = searchQuery.trim().toLocaleLowerCase();
  const filteredCurrencyGroups = currencyGroups.reduce<typeof currencyGroups>((groups, group) => {
    const matchingCurrencies = group.currencies.filter((currency) => {
      return (
        currency.code.toLocaleLowerCase().includes(normalizedQuery) ||
        currency.name.toLocaleLowerCase().includes(normalizedQuery)
      );
    });

    if (matchingCurrencies.length > 0) {
      groups.push({ ...group, currencies: matchingCurrencies });
    }

    return groups;
  }, []);
  const showCurrencyGroupHeaders = normalizedQuery.length === 0;
  const visibleCurrencies = filteredCurrencyGroups.flatMap((group) => group.currencies);
  const activeCurrency =
    visibleCurrencies.find((currency) => currency.code === activeCurrencyCode) ??
    visibleCurrencies[0];

  function focusSearchInput() {
    searchRef.current?.focus({ preventScroll: true });
    searchRef.current?.select();
  }

  function openPicker() {
    const initialCurrency = selectedCurrency ?? currencyGroups[0]?.currencies[0];

    setSearchQuery("");
    setActiveCurrencyCode(initialCurrency?.code ?? "");
    setIsOpen(true);
    onPickerOpen?.();
  }

  function finishOpeningPicker() {
    openPicker();
    focusSearchInput();
  }

  function openPickerFromTrigger() {
    scrollTriggerIntoMobilePosition();
    finishOpeningPicker();
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

  function handleSearchKeyDown(
    event: React.KeyboardEvent<HTMLElement>,
    currencyButtons: HTMLButtonElement[]
  ) {
    if (event.target !== searchRef.current) {
      return false;
    }

    if (event.key === "Enter") {
      event.preventDefault();

      if (currencyButtons.length === 1) {
        currencyButtons[0]?.click();
      } else if (currencyButtons.length > 1) {
        rovingFocus.focusItem(
          currencyButtons.find((button) => button.tabIndex === 0) ?? currencyButtons[0]
        );
      }
      return true;
    }

    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      rovingFocus.focusItem(
        event.key === "ArrowUp"
          ? currencyButtons.at(-1)
          : (currencyButtons.find((button) => button.tabIndex === 0) ?? currencyButtons[0])
      );
      return true;
    }

    return false;
  }

  function handleTypeToSearch(event: React.KeyboardEvent<HTMLDivElement>) {
    if (
      !isPrintableSearchKey(event) ||
      !(document.activeElement instanceof HTMLElement) ||
      !document.activeElement.matches("[data-currency-option]")
    ) {
      return false;
    }

    event.preventDefault();
    setSearchQuery((query) => `${query}${event.key}`);
    searchRef.current?.focus();
    return true;
  }

  function handleTabKeyDown(event: React.KeyboardEvent<HTMLElement>) {
    if (event.key !== "Tab") {
      return false;
    }

    if (
      document.activeElement instanceof HTMLElement &&
      document.activeElement.matches("[data-currency-option]")
    ) {
      event.preventDefault();
      searchRef.current?.focus();
      return true;
    }

    return false;
  }

  function handleSearchInputKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    const currencyButtons = Array.from(
      panelRef.current?.querySelectorAll<HTMLButtonElement>("[data-currency-option]") ?? []
    );

    if (handleSearchKeyDown(event, currencyButtons)) {
      event.stopPropagation();
      return;
    }

    if (event.key === "Tab") {
      event.preventDefault();
      event.stopPropagation();
      rovingFocus.focusItem(
        currencyButtons.find((button) => button.tabIndex === 0) ?? currencyButtons[0]
      );
    }
  }

  function handlePanelKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      closePicker();
      return;
    }

    if (event.target === searchRef.current) {
      return;
    }

    if (rovingFocus.handleKeyDown(event)) {
      return;
    }

    if (handleTypeToSearch(event)) {
      return;
    }

    handleTabKeyDown(event);
  }

  function handleSelect(currency: CurrencyPickerItem) {
    onCurrencySelect?.(currency);
    closePicker();
  }

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
        aria-label={selectedCurrency?.code ?? currencyCode}
        countryCode={selectedCurrency?.countryCode ?? countryCode}
        currencyCode={selectedCurrency?.code ?? currencyCode}
        flagFetchPriority={flagFetchPriority}
        flagLoading={flagLoading}
        onClick={() => {
          if (isOpen) {
            setIsOpen(false);
          } else {
            openPickerFromTrigger();
          }
        }}
        onKeyDown={(event) => {
          if (!isOpen && (event.key === "ArrowDown" || event.key === "ArrowUp")) {
            event.preventDefault();
            openPickerFromTrigger();
          }
        }}
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
          onKeyDown={handlePanelKeyDown}
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
            onKeyDown={handleSearchInputKeyDown}
            shortcutBadge={shortcuts?.formatShortcut({ key: "K", modifier: "primary" }) ?? "Ctrl K"}
            value={searchQuery}
          />

          <div
            ref={resultsRef}
            className="flex min-h-0 flex-col gap-025 overflow-y-auto overscroll-contain"
            aria-label="Currency results"
            data-currency-results-scroll
            data-test-id="currency-results"
            id={resultsId}
          >
            {filteredCurrencyGroups.map((group) => (
              <section key={group.label} aria-label={group.label}>
                {showCurrencyGroupHeaders ? (
                  <div className="mx-100 mb-050 flex items-center justify-between p-100 text-preset-5 text-neutral-200 uppercase shadow-[inset_0_-1px_0_0_hsl(var(--neutral-500))]">
                    <h3>{group.label}</h3>
                    <span>{group.count}</span>
                  </div>
                ) : null}

                <ul>
                  {group.currencies.map((currency) => {
                    const isSelected = currency.code === currencyCode;

                    return (
                      <CurrencyItem
                        key={currency.code}
                        currency={currency}
                        isActive={currency.code === activeCurrency?.code}
                        isSelected={isSelected}
                        onSelect={handleSelect}
                      />
                    );
                  })}
                </ul>
              </section>
            ))}
            {visibleCurrencies.length === 0 ? (
              <p className="px-200 py-300 text-center text-preset-5 text-neutral-200" role="status">
                No currencies found.
              </p>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function CurrencyPickerWithData({ currenciesPromise, ...props }: CurrencyPickerWithDataProps) {
  const currencies = React.use(currenciesPromise);

  return <CurrencyPicker {...props} currencies={currencies} />;
}

export { CurrencyPicker, CurrencyPickerWithData, getCurrencyGroups };
