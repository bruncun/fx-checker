"use client";

import * as React from "react";

import { useRovingTabIndex } from "@/hooks/use-roving-tabindex";
import type { AvailableCurrency } from "../model/currencies";
import { getCurrencyGroups, type CurrencyPickerItem } from "../model/currency-groups";
import { CurrencyItem } from "./currency-picker-item";
import type { CurrencyPickerContentHandle } from "./currency-picker-shell";

function isPrintableSearchKey(event: React.KeyboardEvent) {
  return (
    event.key.length === 1 && event.key !== " " && !event.altKey && !event.ctrlKey && !event.metaKey
  );
}

type CurrencyPickerContentProps = {
  currencies: AvailableCurrency[];
  currencyCode: string;
  onReady: () => void;
  ref?: React.Ref<CurrencyPickerContentHandle>;
  resultsRef: React.RefObject<HTMLDivElement | null>;
  searchQuery: string;
  searchRef: React.RefObject<HTMLInputElement | null>;
  setSearchQuery: React.Dispatch<React.SetStateAction<string>>;
  onSelect: (currency: CurrencyPickerItem) => void;
};

function CurrencyPickerContent({
  currencies,
  currencyCode,
  onReady,
  ref,
  resultsRef,
  searchQuery,
  searchRef,
  setSearchQuery,
  onSelect,
}: CurrencyPickerContentProps) {
  const [activeCurrencyCode, setActiveCurrencyCode] = React.useState(currencyCode);
  const rovingFocus = useRovingTabIndex<HTMLButtonElement>({
    containerRef: resultsRef,
    itemSelector: "[data-currency-option]",
    onCurrentElementChange: (button) => {
      setActiveCurrencyCode(button.dataset.currencyCode ?? "");
    },
    orientation: "vertical",
  });
  const currencyGroups = getCurrencyGroups(currencies);
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

  function getCurrencyButtons() {
    return Array.from(
      resultsRef.current?.querySelectorAll<HTMLButtonElement>("[data-currency-option]") ?? []
    );
  }

  function runSearchAction(key: string) {
    const currencyButtons = getCurrencyButtons();

    if (key === "Enter") {
      if (currencyButtons.length === 1) {
        currencyButtons[0]?.click();
      } else if (currencyButtons.length > 1) {
        rovingFocus.focusItem(
          currencyButtons.find((button) => button.tabIndex === 0) ?? currencyButtons[0]
        );
      }
      return true;
    }

    if (key === "ArrowDown" || key === "ArrowUp") {
      rovingFocus.focusItem(
        key === "ArrowUp"
          ? currencyButtons.at(-1)
          : (currencyButtons.find((button) => button.tabIndex === 0) ?? currencyButtons[0])
      );
      return true;
    }

    if (key === "Tab") {
      rovingFocus.focusItem(
        currencyButtons.find((button) => button.tabIndex === 0) ?? currencyButtons[0]
      );
      return true;
    }

    return false;
  }

  function handleSearchKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (!runSearchAction(event.key)) {
      return false;
    }

    event.preventDefault();
    return true;
  }

  function handleResultsKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (rovingFocus.handleKeyDown(event)) {
      return true;
    }

    if (
      isPrintableSearchKey(event) &&
      document.activeElement instanceof HTMLElement &&
      document.activeElement.matches("[data-currency-option]")
    ) {
      event.preventDefault();
      event.stopPropagation();
      setSearchQuery((query) => `${query}${event.key}`);
      searchRef.current?.focus();
      return true;
    }

    if (
      event.key === "Tab" &&
      document.activeElement instanceof HTMLElement &&
      document.activeElement.matches("[data-currency-option]")
    ) {
      event.preventDefault();
      event.stopPropagation();
      searchRef.current?.focus();
      return true;
    }

    return false;
  }

  React.useImperativeHandle(ref, () => ({
    handleResultsKeyDown,
    handleSearchKeyDown,
    runSearchAction,
  }));

  React.useLayoutEffect(() => {
    onReady();
  }, [onReady]);

  return (
    <>
      {filteredCurrencyGroups.map((group) => (
        <section key={group.label} aria-label={group.label}>
          {showCurrencyGroupHeaders ? (
            <div className="mx-100 mb-050 flex items-center justify-between p-100 text-preset-5 text-neutral-200 uppercase shadow-[inset_0_-1px_0_0_hsl(var(--neutral-500))]">
              <h3>{group.label}</h3>
              <span>{group.count}</span>
            </div>
          ) : null}

          <ul>
            {group.currencies.map((currency) => (
              <CurrencyItem
                key={currency.code}
                currency={currency}
                isActive={currency.code === activeCurrency?.code}
                isSelected={currency.code === currencyCode}
                onSelect={onSelect}
              />
            ))}
          </ul>
        </section>
      ))}
      {visibleCurrencies.length === 0 ? (
        <p className="px-200 py-300 text-center text-preset-5 text-neutral-200" role="status">
          No currencies found.
        </p>
      ) : null}
    </>
  );
}

export { CurrencyPickerContent };
export type { CurrencyPickerContentProps };
