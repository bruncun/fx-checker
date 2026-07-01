"use client";

import { Flag } from "@/components/ui/flag";
import { FavoriteButton } from "@/components/ui/favorite-button";
import type { AvailableCurrency } from "@/features/converter/currencies";
import {
  convertAmount,
  formatExchangeRate,
  getExchangeRate,
  MoneyDecimal,
} from "@/features/converter/exchange";
import { useCompareRatesPresentation } from "./compare-rates-context";

const COMPARE_CURRENCY_PRESETS = ["GBP", "JPY", "CHF", "CAD", "AUD", "INR", "CNY", "BDT"];
const PLACEHOLDER_FAVORITES = new Set(["GBP", "JPY", "INR", "BDT"]);

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
  rate: string;
};

function CompareRateItem({ amount, currency, rate }: CompareRateItemProps) {
  const isFavorited = PLACEHOLDER_FAVORITES.has(currency.code);

  return (
    <li>
      <div className="grid w-full grid-cols-[auto_minmax(0,1fr)_auto_auto] items-center gap-x-125 rounded-16 bg-neutral-600 px-150 py-150 text-left shadow-[inset_0_0_0_1px_hsl(var(--neutral-500))] sm:gap-x-250 sm:px-200">
        <Flag className="size-300" countryCode={currency.countryCode} />
        <span className="max-w-[16ch] min-w-0 sm:max-w-none">
          <span className="block text-preset-4 text-neutral-50">{currency.code}</span>
          <span className="mt-075 block truncate text-preset-5 text-neutral-200">
            {currency.name}
          </span>
        </span>
        <span className="max-w-[16ch] min-w-0 text-right sm:max-w-none">
          <span className="block truncate text-preset-3 text-neutral-50">{amount}</span>
          <span className="mt-075 block text-preset-6 text-neutral-200">@ {rate}</span>
        </span>
        <FavoriteButton
          aria-label={
            isFavorited ? `Remove ${currency.code} from favorites` : `Favorite ${currency.code}`
          }
          pinned={isFavorited}
          variant="icon"
        />
      </div>
    </li>
  );
}

function CompareRates() {
  const { amount, amountSource, availableCurrencies, rates, receiveCurrency, sendCurrency } =
    useCompareRatesPresentation();
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
    .filter((item): item is CompareRateItemProps => item !== null);

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
      <ul className="flex flex-col gap-150">
        {compareRates.map((item) => (
          <CompareRateItem
            key={item.currency.code}
            amount={item.amount}
            currency={item.currency}
            rate={item.rate}
          />
        ))}
      </ul>
    </section>
  );
}

export { CompareRates, getCompareCurrencies };
