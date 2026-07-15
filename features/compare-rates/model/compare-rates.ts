import type { AvailableCurrency } from "@/features/converter/model/currencies";
import {
  convertAmount,
  formatExchangeRate,
  getExchangeRate,
  MoneyDecimal,
  type AmountSide,
} from "@/features/converter/model/exchange";
import type { SelectedCurrency } from "@/features/converter/model/selected-currency";
import type { FrankfurterRate } from "@/lib/frankfurter";

const COMPARE_CURRENCY_PRESETS = ["GBP", "JPY", "CHF", "CAD", "AUD", "INR", "CNY", "BDT"];

export type CompareRateItemData = {
  amount: string;
  currency: AvailableCurrency;
  rate: string;
};

export type CompareRatesModelInput = {
  amount: string;
  amountSource: AmountSide;
  availableCurrencies: AvailableCurrency[];
  rates: FrankfurterRate[];
  receiveCurrency: SelectedCurrency;
  sendCurrency: SelectedCurrency;
};

export function formatMoneyValue(value: string, fallback = "0") {
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

export function getCompareCurrencies(currencies: AvailableCurrency[], sendCurrencyCode: string) {
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

export function getCompareSendAmount({
  amount,
  amountSource,
  rates,
  receiveCurrency,
  sendCurrency,
}: Pick<
  CompareRatesModelInput,
  "amount" | "amountSource" | "rates" | "receiveCurrency" | "sendCurrency"
>) {
  const selectedExchangeRate = getExchangeRate(
    rates,
    sendCurrency.currencyCode,
    receiveCurrency.currencyCode
  );
  const inverseExchangeRate =
    selectedExchangeRate === null ? null : new MoneyDecimal(1).div(selectedExchangeRate);

  return amountSource === "send" ? amount : convertAmount(amount, inverseExchangeRate) || "";
}

export function getCompareRateItems({
  availableCurrencies,
  rates,
  sendAmount,
  sendCurrency,
}: Pick<CompareRatesModelInput, "availableCurrencies" | "rates" | "sendCurrency"> & {
  sendAmount: string;
}) {
  return getCompareCurrencies(availableCurrencies, sendCurrency.currencyCode)
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
}

export function getCompareRatesModel(input: CompareRatesModelInput) {
  const sendAmount = getCompareSendAmount(input);
  const compareRates = getCompareRateItems({
    availableCurrencies: input.availableCurrencies,
    rates: input.rates,
    sendAmount,
    sendCurrency: input.sendCurrency,
  });

  return { compareRates, sendAmount };
}
