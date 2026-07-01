"use client";

import * as React from "react";

import { Flag } from "@/components/ui/flag";
import { FavoriteButton } from "@/components/ui/favorite-button";
import { useRovingTabIndex } from "@/components/ui/use-roving-tabindex";
import type { AvailableCurrency } from "@/features/converter/currencies";
import {
  convertAmount,
  formatExchangeRate,
  getExchangeRate,
  MoneyDecimal,
} from "@/features/converter/exchange";
import { findFavorite, type Favorite, type FavoriteCurrencyPair } from "@/features/favorites";
import { useCompareRatesPresentation } from "./compare-rates-context";

const COMPARE_CURRENCY_PRESETS = ["GBP", "JPY", "CHF", "CAD", "AUD", "INR", "CNY", "BDT"];

function formatMoneyValue(value: string, fallback = "0") {
  if (!value) {
    return fallback;
  }

  try {
    const decimal = new MoneyDecimal(value);
    const fractionDigits = Math.max(0, decimal.decimalPlaces());

    return new Intl.NumberFormat("en-US", {
      maximumFractionDigits: fractionDigits,
      minimumFractionDigits: fractionDigits,
    }).format(decimal.toNumber());
  } catch {
    return fallback;
  }
}

function getCompareCurrencies(currencies: AvailableCurrency[], sendCurrencyCode: string) {
  const currencyByCode = new Map(currencies.map((currency) => [currency.code, currency]));
  const preferredCurrencies = COMPARE_CURRENCY_PRESETS.flatMap((code) => {
    const currency = currencyByCode.get(code);

    return currency && currency.code !== sendCurrencyCode ? [currency] : [];
  });
  const preferredCodes = new Set(preferredCurrencies.map((currency) => currency.code));
  const fallbackCurrencies = currencies.filter(
    (currency) => currency.code !== sendCurrencyCode && !preferredCodes.has(currency.code)
  );

  return [...preferredCurrencies, ...fallbackCurrencies].slice(0, 8);
}

type CompareRateItemProps = {
  amount: string;
  currency: AvailableCurrency;
  favorites: Favorite[];
  fromCurrencyCode: string;
  isSelected: boolean;
  onCompareCurrencySelect: (currency: AvailableCurrency) => void;
  onFavoriteToggle: (pair: FavoriteCurrencyPair) => void;
  rate: string;
  tabIndex: 0 | -1;
};

type CompareRateItemData = Pick<CompareRateItemProps, "amount" | "currency" | "rate">;

function CompareRateItem({
  amount,
  currency,
  favorites,
  fromCurrencyCode,
  isSelected,
  onCompareCurrencySelect,
  onFavoriteToggle,
  rate,
  tabIndex,
}: CompareRateItemProps) {
  const favoriteButtonRef = React.useRef<HTMLButtonElement>(null);
  const pair = {
    fromCurrency: fromCurrencyCode,
    toCurrency: currency.code,
  };
  const isFavorited = findFavorite(favorites, pair) !== null;
  const rowLabel = `Use ${fromCurrencyCode}/${currency.code} in converter, ${amount} ${currency.code} at ${rate}`;

  function selectCompareCurrency() {
    onCompareCurrencySelect(currency);
  }

  function handleRowKeyDown(event: React.KeyboardEvent<HTMLTableRowElement>) {
    if (event.target !== event.currentTarget) {
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      selectCompareCurrency();
      return;
    }

    if (event.key === "Tab" && !event.shiftKey) {
      event.preventDefault();
      favoriteButtonRef.current?.focus({ preventScroll: true });
      return;
    }

    if (event.key === "ArrowRight" || event.key === "F2") {
      event.preventDefault();
      favoriteButtonRef.current?.focus({ preventScroll: true });
    }
  }

  function handleFavoriteKeyDown(event: React.KeyboardEvent<HTMLButtonElement>) {
    if (
      event.key !== "ArrowLeft" &&
      event.key !== "Escape" &&
      event.key !== "F2" &&
      (event.key !== "Tab" || !event.shiftKey)
    ) {
      return;
    }

    const row = event.currentTarget.closest<HTMLTableRowElement>("[data-compare-rate-row]");

    event.preventDefault();
    row?.focus({ preventScroll: true });
  }

  return (
    <tr
      aria-label={rowLabel}
      aria-level={1}
      aria-selected={isSelected}
      className="grid w-full grid-cols-[auto_minmax(0,1fr)_auto_auto] items-center gap-x-125 rounded-16 bg-neutral-600 px-150 py-150 text-left shadow-[inset_0_0_0_1px_hsl(var(--neutral-500))] outline-none hover:shadow-[inset_0_0_0_1px_hsl(var(--neutral-300))] focus-visible:shadow-[inset_0_0_0_1px_hsl(var(--lime-500))] sm:gap-x-250 sm:px-200"
      data-compare-rate-code={currency.code}
      data-compare-rate-row
      onClick={selectCompareCurrency}
      onKeyDown={handleRowKeyDown}
      role="row"
      tabIndex={tabIndex}
    >
      <td className="block" role="gridcell">
        <Flag className="size-300" countryCode={currency.countryCode} />
      </td>
      <td className="block max-w-[16ch] min-w-0 sm:max-w-none" role="gridcell">
        <span className="block text-preset-4 text-neutral-50">{currency.code}</span>
        <span className="mt-075 block truncate text-preset-5 text-neutral-200">
          {currency.name}
        </span>
      </td>
      <td className="block max-w-[16ch] min-w-0 text-right sm:max-w-none" role="gridcell">
        <span className="block truncate text-preset-3 text-neutral-50">{amount}</span>
        <span className="mt-075 block text-preset-6 text-neutral-200">@ {rate}</span>
      </td>
      <td className="block" role="gridcell">
        <FavoriteButton
          aria-label={
            isFavorited
              ? `Remove ${fromCurrencyCode}/${currency.code} from favorites`
              : `Favorite ${fromCurrencyCode}/${currency.code}`
          }
          onClick={(event) => {
            event.stopPropagation();
            onFavoriteToggle(pair);
          }}
          onKeyDown={handleFavoriteKeyDown}
          pinned={isFavorited}
          ref={favoriteButtonRef}
          tabIndex={-1}
          variant="icon"
          data-compare-favorite-button
        />
      </td>
    </tr>
  );
}

function CompareRates() {
  const treeGridRef = React.useRef<HTMLTableElement>(null);
  const {
    amount,
    amountSource,
    availableCurrencies,
    favorites,
    rates,
    receiveCurrency,
    sendCurrency,
    onCompareCurrencySelect,
    onFavoriteToggle,
  } = useCompareRatesPresentation();
  const [preferredTabStopCode, setPreferredTabStopCode] = React.useState(
    receiveCurrency.currencyCode
  );
  const selectedExchangeRate = getExchangeRate(
    rates,
    sendCurrency.currencyCode,
    receiveCurrency.currencyCode
  );
  const inverseExchangeRate =
    selectedExchangeRate === null ? null : new MoneyDecimal(1).div(selectedExchangeRate);
  const sendAmount =
    amountSource === "send" ? amount : convertAmount(amount, inverseExchangeRate) || "";
  const compareRates = getCompareCurrencies(availableCurrencies, sendCurrency.currencyCode)
    .map((currency) => {
      const rate = getExchangeRate(rates, sendCurrency.currencyCode, currency.code);

      if (rate === null) {
        return null;
      }

      return {
        amount: formatMoneyValue(convertAmount(sendAmount, rate)),
        currency,
        rate: formatExchangeRate(rate),
      };
    })
    .filter((item): item is CompareRateItemData => item !== null);
  const tabStopCode = compareRates.some((item) => item.currency.code === preferredTabStopCode)
    ? preferredTabStopCode
    : (compareRates[0]?.currency.code ?? "");
  const rovingFocus = useRovingTabIndex<HTMLTableRowElement>({
    containerRef: treeGridRef,
    itemSelector: "[data-compare-rate-row]",
    onCurrentElementChange: (row) => {
      setPreferredTabStopCode(row.dataset.compareRateCode ?? "");
    },
    orientation: "vertical",
  });

  function selectCompareCurrency(currency: AvailableCurrency) {
    onCompareCurrencySelect({
      countryCode: currency.countryCode,
      currencyCode: currency.code,
    });
    setPreferredTabStopCode(currency.code);
  }

  function handleTreeGridKeyDown(event: React.KeyboardEvent<HTMLTableElement>) {
    const target = event.target as HTMLElement;

    if (target.closest("[data-compare-favorite-button]")) {
      return;
    }

    rovingFocus.handleKeyDown(event);
  }

  return (
    <section
      aria-label="Compare"
      className="rounded-20 bg-neutral-700 p-200 shadow-[inset_0_0_0_1px_hsl(var(--neutral-600))] sm:p-250"
    >
      <header className="pb-200 uppercase sm:flex sm:items-center sm:justify-between sm:pb-250">
        <h2
          id="compare-heading"
          className="flex min-w-0 flex-wrap gap-x-125 text-preset-4 text-neutral-200"
        >
          <span>Multi-Currency</span>
          <span className="inline-flex min-w-0 gap-125 text-preset-3-medium text-neutral-50">
            <span className="max-w-[12ch] truncate sm:max-w-none">
              {formatMoneyValue(sendAmount)}
            </span>
            <span className="shrink-0">From {sendCurrency.currencyCode}</span>
          </span>
        </h2>
        <p className="mt-125 text-preset-5 text-neutral-50 opacity-70 sm:mt-0">
          {compareRates.length} Pairs
        </p>
      </header>
      <table
        aria-labelledby="compare-heading"
        className="block w-full border-separate border-spacing-y-150"
        onKeyDown={handleTreeGridKeyDown}
        ref={treeGridRef}
        role="treegrid"
      >
        <thead className="sr-only">
          <tr role="row">
            <th role="columnheader" scope="col">
              Flag
            </th>
            <th role="columnheader" scope="col">
              Currency
            </th>
            <th role="columnheader" scope="col">
              Converted amount
            </th>
            <th role="columnheader" scope="col">
              Favorite
            </th>
          </tr>
        </thead>
        <tbody className="flex flex-col gap-150" role="rowgroup">
          {compareRates.map((item) => (
            <CompareRateItem
              key={item.currency.code}
              amount={item.amount}
              currency={item.currency}
              favorites={favorites}
              fromCurrencyCode={sendCurrency.currencyCode}
              isSelected={item.currency.code === receiveCurrency.currencyCode}
              onCompareCurrencySelect={selectCompareCurrency}
              onFavoriteToggle={onFavoriteToggle}
              rate={item.rate}
              tabIndex={item.currency.code === tabStopCode ? 0 : -1}
            />
          ))}
        </tbody>
      </table>
    </section>
  );
}

export { CompareRates, getCompareCurrencies };
