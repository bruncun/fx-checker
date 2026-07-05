import type { SelectedCurrency } from "@/features/converter";
import type { AvailableCurrency } from "@/features/converter/currencies";
import type { AmountSide } from "@/features/converter/exchange";

const DEFAULT_CONVERTER_AMOUNT = "1000";
const DEFAULT_CONVERTER_AMOUNT_SOURCE: AmountSide = "send";

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
  const sendCurrency = getCurrencyByCode(currencies, searchParams.get("from")?.toUpperCase() ?? "");
  const receiveCurrency = getCurrencyByCode(
    currencies,
    searchParams.get("to")?.toUpperCase() ?? ""
  );

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
  searchParams,
  sendCurrency,
}: {
  amount?: string;
  amountSource?: AmountSide;
  pathname: string;
  receiveCurrency: SelectedCurrency;
  searchParams: URLSearchParams;
  sendCurrency: SelectedCurrency;
}) {
  const nextSearchParams = new URLSearchParams(searchParams);

  nextSearchParams.set("from", sendCurrency.currencyCode);
  nextSearchParams.set("to", receiveCurrency.currencyCode);

  if (amount !== undefined) {
    nextSearchParams.set("amount", amount);
  }

  if (amountSource !== undefined) {
    nextSearchParams.set("amountSource", amountSource);
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
  } satisfies { amount: string; amountSource: AmountSide };
}

export {
  getConverterAmountFromParams,
  getCurrencyByCode,
  getCurrencyPairUrl,
  getDefaultCurrencyPair,
  getSelectedCurrencyPairFromParams,
  getSelectedCurrencyPairKey,
};
