import type { SelectedCurrency } from "@/features/converter";
import type { AvailableCurrency } from "@/features/converter/model/currencies";
import type { AmountSide } from "@/features/converter/model/exchange";
import { historyRanges, type HistoryRange } from "@/features/rate-history";

const DEFAULT_CONVERTER_AMOUNT = "1000";
const DEFAULT_CONVERTER_AMOUNT_SOURCE: AmountSide = "send";
const DEFAULT_SEND_CURRENCY = "USD";
const DEFAULT_RECEIVE_CURRENCY = "EUR";
const DEFAULT_HISTORY_RANGE: HistoryRange = "1M";

type SearchParamsInput = URLSearchParams | Record<string, string | undefined>;

function createUrlSearchParams(input: SearchParamsInput) {
  if (input instanceof URLSearchParams) {
    return input;
  }

  const searchParams = new URLSearchParams();

  Object.entries(input).forEach(([key, value]) => {
    if (value !== undefined) {
      searchParams.set(key, value);
    }
  });

  return searchParams;
}

function normalizeCurrencyCode(value: string | undefined, fallback: string) {
  const normalizedValue = value?.trim().toUpperCase();

  return normalizedValue && /^[A-Z]{3}$/.test(normalizedValue) ? normalizedValue : fallback;
}

function normalizeHistoryRange(value: string | undefined): HistoryRange {
  return historyRanges.includes(value as HistoryRange)
    ? (value as HistoryRange)
    : DEFAULT_HISTORY_RANGE;
}

function getCurrencyCodePairFromParams(input: SearchParamsInput) {
  const searchParams = createUrlSearchParams(input);

  return {
    receiveCurrencyCode: normalizeCurrencyCode(
      searchParams.get("to") ?? undefined,
      DEFAULT_RECEIVE_CURRENCY
    ),
    sendCurrencyCode: normalizeCurrencyCode(
      searchParams.get("from") ?? undefined,
      DEFAULT_SEND_CURRENCY
    ),
  };
}

function getRateHistoryUrlStateFromParams(input: SearchParamsInput) {
  const searchParams = createUrlSearchParams(input);
  const { receiveCurrencyCode, sendCurrencyCode } = getCurrencyCodePairFromParams(searchParams);

  return {
    receiveCurrencyCode,
    selectedPair: `${sendCurrencyCode}/${receiveCurrencyCode}`,
    selectedRange: normalizeHistoryRange(searchParams.get("range") ?? undefined),
    sendCurrencyCode,
  };
}

function getCurrencyPairLabelFromParams(input: SearchParamsInput) {
  const { receiveCurrencyCode, sendCurrencyCode } = getCurrencyCodePairFromParams(input);

  return `${sendCurrencyCode}/${receiveCurrencyCode}`;
}

function getCurrencyByCode(currencies: AvailableCurrency[], code: string): SelectedCurrency | null {
  const currency = currencies.find((availableCurrency) => availableCurrency.code === code);

  if (!currency) {
    return null;
  }

  return {
    countryCode: currency.countryCode,
    currencyCode: currency.code,
  };
}

function getDefaultCurrencyPair(currencies: AvailableCurrency[]) {
  const defaultSendCurrency =
    currencies.find((currency) => currency.code === "USD") ?? currencies[0];
  const defaultReceiveCurrency =
    currencies.find(
      (currency) => currency.code === "EUR" && currency.code !== defaultSendCurrency.code
    ) ??
    currencies.find((currency) => currency.code !== defaultSendCurrency.code) ??
    defaultSendCurrency;

  return {
    sendCurrency: {
      countryCode: defaultSendCurrency.countryCode,
      currencyCode: defaultSendCurrency.code,
    },
    receiveCurrency: {
      countryCode: defaultReceiveCurrency.countryCode,
      currencyCode: defaultReceiveCurrency.code,
    },
  };
}

function getSelectedCurrencyPairFromParams(
  currencies: AvailableCurrency[],
  searchParams: URLSearchParams
) {
  const defaultCurrencyPair = getDefaultCurrencyPair(currencies);
  const { receiveCurrencyCode, sendCurrencyCode } = getCurrencyCodePairFromParams(searchParams);
  const sendCurrency = getCurrencyByCode(currencies, sendCurrencyCode);
  const receiveCurrency = getCurrencyByCode(currencies, receiveCurrencyCode);

  return {
    sendCurrency: sendCurrency ?? defaultCurrencyPair.sendCurrency,
    receiveCurrency: receiveCurrency ?? defaultCurrencyPair.receiveCurrency,
  };
}

function getCurrencyPairUrl({
  amount,
  amountSource,
  pathname,
  receiveCurrency,
  receiveAmount,
  searchParams,
  sendCurrency,
}: {
  amount?: string;
  amountSource?: AmountSide;
  pathname: string;
  receiveCurrency: SelectedCurrency;
  receiveAmount?: string;
  searchParams: URLSearchParams;
  sendCurrency: SelectedCurrency;
}) {
  const nextSearchParams = new URLSearchParams(searchParams);

  nextSearchParams.set("from", sendCurrency.currencyCode);
  nextSearchParams.set("to", receiveCurrency.currencyCode);
  nextSearchParams.delete("receiveAmount");

  if (amount !== undefined) {
    nextSearchParams.set("amount", amount);
  }

  if (amountSource !== undefined) {
    nextSearchParams.set("amountSource", amountSource);
  }

  if (receiveAmount !== undefined) {
    nextSearchParams.set("receiveAmount", receiveAmount);
  }

  const queryString = nextSearchParams.toString();

  return queryString ? `${pathname}?${queryString}` : pathname;
}

function getSelectedCurrencyPairKey({
  receiveCurrency,
  sendCurrency,
}: {
  receiveCurrency: SelectedCurrency;
  sendCurrency: SelectedCurrency;
}) {
  return `${sendCurrency.currencyCode}/${receiveCurrency.currencyCode}`;
}

function getConverterAmountFromParams(searchParams: URLSearchParams) {
  const amount = searchParams.has("amount")
    ? (searchParams.get("amount") ?? "")
    : DEFAULT_CONVERTER_AMOUNT;
  const amountSource =
    searchParams.get("amountSource") === "receive" ? "receive" : DEFAULT_CONVERTER_AMOUNT_SOURCE;

  return {
    amount,
    amountSource,
    receiveAmount:
      amountSource === "send" && searchParams.has("receiveAmount")
        ? (searchParams.get("receiveAmount") ?? "")
        : undefined,
  } satisfies { amount: string; amountSource: AmountSide; receiveAmount?: string };
}

export {
  createUrlSearchParams,
  getConverterAmountFromParams,
  getCurrencyCodePairFromParams,
  getCurrencyPairLabelFromParams,
  getCurrencyByCode,
  getCurrencyPairUrl,
  getDefaultCurrencyPair,
  getRateHistoryUrlStateFromParams,
  getSelectedCurrencyPairFromParams,
  getSelectedCurrencyPairKey,
};
