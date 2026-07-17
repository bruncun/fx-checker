import {
  getConverterAmountFromParams,
  getCurrencyCodePairFromParams,
} from "@/features/home/utils/url-state";
import { getCurrencyFlagCountryCode } from "./currencies";
import { formatExchangeRate, getConverterExchangeRate, type ConverterRates } from "./exchange";
import type { SelectedCurrency } from "./selected-currency";

const defaultSelectedCurrencies = {
  receiveCurrency: { currencyCode: "EUR" },
  sendCurrency: { currencyCode: "USD" },
} satisfies { receiveCurrency: SelectedCurrency; sendCurrency: SelectedCurrency };

function getSelectableCurrencyCodes(rates: ConverterRates) {
  return rates.base ? new Set([rates.base, ...Object.keys(rates.rates)]) : new Set<string>();
}

export function getSelectedCurrencyPairFromCodes(
  rates: ConverterRates,
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
      countryCode: getCurrencyFlagCountryCode(
        selectableCurrencyCodes.has(receiveCurrencyCode)
          ? receiveCurrencyCode
          : fallbackReceiveCurrencyCode
      ),
      currencyCode: selectableCurrencyCodes.has(receiveCurrencyCode)
        ? receiveCurrencyCode
        : fallbackReceiveCurrencyCode,
    },
    sendCurrency: {
      countryCode: getCurrencyFlagCountryCode(
        selectableCurrencyCodes.has(sendCurrencyCode) ? sendCurrencyCode : fallbackSendCurrencyCode
      ),
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
  rates: ConverterRates;
  receiveCurrency: SelectedCurrency;
  sendCurrency: SelectedCurrency;
}) {
  const exchangeRate = getConverterExchangeRate(
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
  rates: ConverterRates;
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
