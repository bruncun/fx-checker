"use client";

import * as React from "react";

import { Flag } from "@/components/ui/flag";
import { FavoriteButton } from "@/components/ui/favorite-button";
import {
  RateDetailsList,
  RateDetailsTreeGrid,
  RateDetailsTreeGridRow,
} from "@/components/ui/rate-details-list";
import { TabEmptyState } from "@/components/ui/tab-empty-state";
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
  const pair = {
    fromCurrency: fromCurrencyCode,
    toCurrency: currency.code,
  };
  const isFavorited = findFavorite(favorites, pair) !== null;
  const rowLabel = `Use ${fromCurrencyCode}/${currency.code} in converter, ${amount} ${currency.code} at ${rate}`;

  function selectCompareCurrency() {
    onCompareCurrencySelect(currency);
  }

  return (
    <RateDetailsTreeGridRow
      aria-label={rowLabel}
      action={(actionProps) => (
        <FavoriteButton
          {...actionProps}
          aria-label={
            isFavorited
              ? `Remove ${fromCurrencyCode}/${currency.code} from favorites`
              : `Favorite ${fromCurrencyCode}/${currency.code}`
          }
          onClick={(event) => {
            event.stopPropagation();
            onFavoriteToggle(pair);
          }}
          pinned={isFavorited}
          variant="icon"
          data-compare-favorite-button
        />
      )}
      gridClassName="grid-cols-[auto_minmax(0,1fr)_auto_auto]"
      isSelected={isSelected}
      onSelect={selectCompareCurrency}
      rowId={currency.code}
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
    </RateDetailsTreeGridRow>
  );
}

function CompareRates() {
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
  const hasCompareAmount = sendAmount.trim() !== "0";
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

  function selectCompareCurrency(currency: AvailableCurrency) {
    onCompareCurrencySelect({
      countryCode: currency.countryCode,
      currencyCode: currency.code,
    });
    setPreferredTabStopCode(currency.code);
  }

  if (!hasCompareAmount) {
    return (
      <TabEmptyState
        title="No comparison available"
        lead={
          <>
            Enter an amount in SEND above to see what your money
            <br />
            is worth in other currencies.
          </>
        }
      />
    );
  }

  return (
    <RateDetailsList
      aria-label="Compare"
      countClassName="mt-125 sm:mt-0"
      countSlot={
        <p className="text-preset-5 text-neutral-50 opacity-70">{compareRates.length} Pairs</p>
      }
      headerClassName="block sm:flex sm:items-center sm:justify-between"
      headingId="compare-heading"
      headingClassName="flex min-w-0 flex-wrap gap-x-125 text-preset-4 text-neutral-200 items-baseline"
      headingSlot={
        <>
          <span>Multi-Currency</span>
          <span className="inline-flex min-w-0 gap-125 text-preset-3-medium text-neutral-50">
            <span className="max-w-[12ch] truncate sm:max-w-none">
              {formatMoneyValue(sendAmount)}
            </span>
            <span className="shrink-0">From {sendCurrency.currencyCode}</span>
          </span>
        </>
      }
    >
      <RateDetailsTreeGrid
        actionSelector="[data-compare-favorite-button]"
        labelledBy="compare-heading"
        onCurrentRowIdChange={setPreferredTabStopCode}
        columns={
          <>
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
          </>
        }
      >
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
      </RateDetailsTreeGrid>
    </RateDetailsList>
  );
}

export { CompareRates, getCompareCurrencies };
