import {
  getConverterAmountFromParams,
  getCurrencyCodePairFromParams,
} from "@/features/home/utils/url-state";
import type { FrankfurterRate } from "@/lib/frankfurter";
import { formatExchangeRate, getExchangeRate } from "./exchange";
import type { SelectedCurrency } from "./selected-currency";

const defaultSelectedCurrencies = {
  receiveCurrency: { currencyCode: "EUR" },
  sendCurrency: { currencyCode: "USD" },
} satisfies { receiveCurrency: SelectedCurrency; sendCurrency: SelectedCurrency };

function getSelectableCurrencyCodes(rates: FrankfurterRate[]) {
  const sharedBase = rates[0]?.base;

  if (!sharedBase || rates.some((rate) => rate.base !== sharedBase)) {
    return new Set<string>();
  }

  return new Set([sharedBase, ...rates.map((rate) => rate.quote)]);
}

export function getSelectedCurrencyPairFromCodes(
  rates: FrankfurterRate[],
  searchParams: URLSearchParams
) {
  const selectableCurrencyCodes = getSelectableCurrencyCodes(rates);
  const { receiveCurrencyCode, sendCurrencyCode } = getCurrencyCodePairFromParams(searchParams);
  const fallbackSendCurrencyCode = selectableCurrencyCodes.has("USD")
    ? "USD"
    : (selectableCurrencyCodes.values().next().value ??
      defaultSelectedCurrencies.sendCurrency.currencyCode);
  const fallbackReceiveCurrencyCode = selectableCurrencyCodes.has("EUR")
    ? "EUR"
    : ([...selectableCurrencyCodes].find((code) => code !== fallbackSendCurrencyCode) ??
      fallbackSendCurrencyCode);

  return {
    receiveCurrency: {
      currencyCode: selectableCurrencyCodes.has(receiveCurrencyCode)
        ? receiveCurrencyCode
        : fallbackReceiveCurrencyCode,
    },
    sendCurrency: {
      currencyCode: selectableCurrencyCodes.has(sendCurrencyCode)
        ? sendCurrencyCode
        : fallbackSendCurrencyCode,
    },
  };
}

export function getExchangeRateLabel({
  rates,
  receiveCurrency,
  sendCurrency,
}: {
  rates: FrankfurterRate[];
  receiveCurrency: SelectedCurrency;
  sendCurrency: SelectedCurrency;
}) {
  const exchangeRate = getExchangeRate(
    rates,
    sendCurrency.currencyCode,
    receiveCurrency.currencyCode
  );

  return exchangeRate === null
    ? `Rate unavailable for ${sendCurrency.currencyCode}/${receiveCurrency.currencyCode}`
    : `1 ${sendCurrency.currencyCode} = ${formatExchangeRate(exchangeRate)} ${receiveCurrency.currencyCode}`;
}

export function getConverterModel({
  rates,
  searchParams,
}: {
  rates: FrankfurterRate[];
  searchParams: URLSearchParams;
}) {
  const selectedCurrencies = getSelectedCurrencyPairFromCodes(rates, searchParams);

  return {
    ...selectedCurrencies,
    converterAmount: getConverterAmountFromParams(searchParams),
    exchangeRateLabel: getExchangeRateLabel({
      rates,
      ...selectedCurrencies,
    }),
  };
}
