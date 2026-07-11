"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import { CurrencyButton } from "@/components/ui/currency-button";
import { Flag, type FlagCountryCode } from "@/components/ui/flag";
import { Icon } from "@/components/ui/icon";
import { SearchInput } from "@/components/ui/search-input";
import { useOptionalKeyboardShortcuts } from "@/features/keyboard-shortcuts";
import { usePointerDownOutside } from "@/hooks/use-pointer-down-outside";
import { useRovingTabIndex } from "@/hooks/use-roving-tabindex";
import type { AvailableCurrency } from "../model/currencies";

export type CurrencyPickerItem = AvailableCurrency;

type CurrencyPickerGroup = {
  count: number;
  currencies: CurrencyPickerItem[];
  label: string;
};

const popularCurrencyCodes = new Set(["USD", "EUR", "GBP"]);
const panelViewportGutter = 16;

function getCurrencyGroups(currencies: AvailableCurrency[]): CurrencyPickerGroup[] {
  const popularCurrencies = currencies.filter((currency) =>
    popularCurrencyCodes.has(currency.code)
  );
  const otherCurrencies = currencies.filter((currency) => !popularCurrencyCodes.has(currency.code));

  return [
    { count: popularCurrencies.length, currencies: popularCurrencies, label: "Popular" },
    { count: otherCurrencies.length, currencies: otherCurrencies, label: "Other currencies" },
  ].filter((group) => group.count > 0);
}

function isPrintableSearchKey(event: React.KeyboardEvent) {
  return (
    event.key.length === 1 && event.key !== " " && !event.altKey && !event.ctrlKey && !event.metaKey
  );
}

export interface CurrencyPickerProps {
  "aria-label"?: string;
  className?: string;
  countryCode: FlagCountryCode;
  currencies: AvailableCurrency[];
  currencyCode: string;
  ref?: React.Ref<CurrencyPickerHandle>;
  onPickerOpen?: () => void;
  onCurrencySelect?: (currency: CurrencyPickerItem) => void;
  left?: boolean;
}

export type CurrencyPickerHandle = {
  focusSearch: () => void;
};

interface CurrencyItemProps {
  currency: CurrencyPickerItem;
  isActive: boolean;
  isSelected: boolean;
  onSelect: (currency: CurrencyPickerItem) => void;
}

function CurrencyItem({ currency, isActive, isSelected, onSelect }: CurrencyItemProps) {
  return (
    <li className="px-100">
      <button
        aria-current={isSelected ? "true" : undefined}
        aria-label={`${currency.code}, ${currency.name}`}
        className={cn(
          "fx-transition-surface flex w-full cursor-pointer items-center gap-150 rounded-4 border-y border-transparent p-150 py-150 text-left text-neutral-50",
          "hover:shadow-[inset_0_0_0_1px_hsl(var(--neutral-200))] focus:shadow-[inset_0_0_0_1px_hsl(var(--lime-500))] focus:outline-none"
        )}
        data-currency-code={currency.code}
        data-currency-option
        onClick={() => {
          onSelect(currency);
        }}
        tabIndex={isActive ? 0 : -1}
        type="button"
      >
        <Flag className="size-250" countryCode={currency.countryCode} alt="" />
        <span className="flex min-w-0 flex-1 items-baseline gap-150">
          <span className="text-preset-4">{currency.code}</span>
          <span className="truncate text-preset-5 text-neutral-200">{currency.name}</span>
        </span>
        {isSelected ? <Icon className="mr-050 size-150" decorative iconName="check" /> : null}
      </button>
    </li>
  );
}

function CurrencyPicker({
  "aria-label": ariaLabel = "Select currency",
  className,
  countryCode,
  currencies,
  currencyCode,
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
  const rootRef = React.useRef<HTMLDivElement>(null);
  const panelRef = React.useRef<HTMLDivElement>(null);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const searchRef = React.useRef<HTMLInputElement>(null);
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
  const filteredCurrencyGroups = currencyGroups
    .map((group) => ({
      ...group,
      currencies: group.currencies.filter((currency) => {
        return (
          currency.code.toLocaleLowerCase().includes(normalizedQuery) ||
          currency.name.toLocaleLowerCase().includes(normalizedQuery)
        );
      }),
    }))
    .filter((group) => group.currencies.length > 0);
  const showCurrencyGroupHeaders = normalizedQuery.length === 0;
  const visibleCurrencies = filteredCurrencyGroups.flatMap((group) => group.currencies);
  const activeCurrency =
    visibleCurrencies.find((currency) => currency.code === activeCurrencyCode) ??
    visibleCurrencies[0];

  function openPicker() {
    const initialCurrency = selectedCurrency ?? currencyGroups[0]?.currencies[0];

    setSearchQuery("");
    setActiveCurrencyCode(initialCurrency?.code ?? "");
    setIsOpen(true);
    onPickerOpen?.();
  }

  function focusSearch() {
    if (!isOpen) {
      openPicker();
      return;
    }

    requestAnimationFrame(() => {
      searchRef.current?.focus();
      searchRef.current?.select();
    });
  }

  React.useImperativeHandle(ref, () => ({ focusSearch }));

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

    searchRef.current?.focus();
    searchRef.current?.select();

    const panel = panelRef.current;

    if (!panel) {
      return;
    }

    const updateAvailableHeight = () => {
      const visualViewport = window.visualViewport;
      const rootTop = rootRef.current?.getBoundingClientRect().top ?? 0;
      const panelTop = rootTop + panel.offsetTop;
      const isWebKit =
        typeof CSS !== "undefined" && CSS.supports("-webkit-backdrop-filter", "none");
      const viewportBottom = visualViewport
        ? visualViewport.height + (isWebKit ? 0 : visualViewport.offsetTop)
        : window.innerHeight;
      const availableHeight = Math.max(
        0,
        Math.floor(viewportBottom - panelTop - panelViewportGutter)
      );

      panel.style.setProperty("--currency-picker-available-height", `${availableHeight}px`);
      panel.style.setProperty("--currency-picker-panel-top", `${Math.max(0, panelTop)}px`);
    };

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
  }, [isOpen]);

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
        aria-label={ariaLabel}
        countryCode={selectedCurrency?.countryCode ?? countryCode}
        currencyCode={selectedCurrency?.code ?? currencyCode}
        onClick={() => {
          if (isOpen) {
            setIsOpen(false);
          } else {
            openPicker();
          }
        }}
        onKeyDown={(event) => {
          if (!isOpen && (event.key === "ArrowDown" || event.key === "ArrowUp")) {
            event.preventDefault();
            openPicker();
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
            className="mx-100 mb-125 shrink-0"
            onChange={(event) => {
              setSearchQuery(event.currentTarget.value);
            }}
            onKeyDown={handleSearchInputKeyDown}
            shortcutBadge={shortcuts?.formatShortcut({ key: "K", modifier: "primary" }) ?? "Ctrl K"}
            value={searchQuery}
          />

          <div
            className="flex min-h-0 flex-col gap-025 overflow-y-auto overscroll-contain"
            data-test-id="currency-results"
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

export { CurrencyPicker, getCurrencyGroups };
