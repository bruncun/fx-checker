import { describe, expect, it } from "vitest";

import type { AvailableCurrency } from "@/features/converter/model/currencies";
import {
  createUrlSearchParams,
  getConverterAmountFromParams,
  getCurrencyCodePairFromParams,
  getCurrencyPairLabelFromParams,
  getCurrencyPairUrl,
  getFxUrlStateFromParams,
  getRateHistoryUrlStateFromParams,
  getSelectedCurrencyPairFromParams,
} from "./url-state";

const currencies: AvailableCurrency[] = [
  { code: "USD", countryCode: "us", name: "United States Dollar" },
  { code: "EUR", countryCode: "eu", name: "Euro" },
  { code: "GBP", countryCode: "gb", name: "British Pound" },
];

describe("url state", () => {
  it("normalizes currency codes from route search params", () => {
    expect(
      getCurrencyCodePairFromParams({
        from: " gbp ",
        to: "eur",
      })
    ).toEqual({
      receiveCurrencyCode: "EUR",
      sendCurrencyCode: "GBP",
    });
  });

  it("falls back to the canonical default currency codes for invalid route params", () => {
    expect(
      getCurrencyCodePairFromParams({
        from: "US",
        to: "EURO",
      })
    ).toEqual({
      receiveCurrencyCode: "EUR",
      sendCurrencyCode: "USD",
    });
  });

  it("normalizes rate-history route params with the shared defaults", () => {
    expect(
      getRateHistoryUrlStateFromParams({
        from: "gbp",
        range: "5Y",
        to: "usd",
      })
    ).toEqual({
      receiveCurrencyCode: "USD",
      selectedPair: "GBP/USD",
      selectedRange: "5Y",
      sendCurrencyCode: "GBP",
    });
  });

  it("builds a canonical FX URL state with a stable route key", () => {
    expect(
      getFxUrlStateFromParams({
        amount: "2500",
        amountSource: "receive",
        from: "gbp",
        range: "1Y",
        receiveAmount: "3000",
        to: "usd",
      })
    ).toEqual({
      amount: "2500",
      amountSource: "receive",
      receiveAmount: undefined,
      receiveCurrencyCode: "USD",
      routeKey: "GBP/USD:1Y",
      selectedPair: "GBP/USD",
      selectedRange: "1Y",
      sendCurrencyCode: "GBP",
    });
  });

  it("falls back to the one-month range for unknown rate-history ranges", () => {
    expect(getRateHistoryUrlStateFromParams({ range: "10Y" }).selectedRange).toBe("1M");
  });

  it("formats the selected currency pair for route labels", () => {
    expect(getCurrencyPairLabelFromParams({ from: "cad", to: "jpy" })).toBe("CAD/JPY");
  });

  it("formats the default currency pair for invalid route label params", () => {
    expect(getCurrencyPairLabelFromParams({ from: "dollars", to: "yenx" })).toBe("USD/EUR");
  });

  it("keeps converter currency selection constrained to available currencies", () => {
    expect(
      getSelectedCurrencyPairFromParams(
        currencies,
        createUrlSearchParams({
          from: "jpy",
          to: "gbp",
        })
      )
    ).toEqual({
      receiveCurrency: { countryCode: "gb", currencyCode: "GBP" },
      sendCurrency: { countryCode: "us", currencyCode: "USD" },
    });
  });

  it("reads a logged receive amount only for send-sourced converter amounts", () => {
    expect(
      getConverterAmountFromParams(
        createUrlSearchParams({
          amount: "1000.00",
          amountSource: "send",
          receiveAmount: "853.02",
        })
      )
    ).toEqual({
      amount: "1000.00",
      amountSource: "send",
      receiveAmount: "853.02",
    });

    expect(
      getConverterAmountFromParams(
        createUrlSearchParams({
          amount: "853.02",
          amountSource: "receive",
          receiveAmount: "853.02",
        })
      )
    ).toEqual({
      amount: "853.02",
      amountSource: "receive",
      receiveAmount: undefined,
    });
  });

  it("clears logged receive amounts when building ordinary currency-pair URLs", () => {
    expect(
      getCurrencyPairUrl({
        pathname: "/rate/favorites",
        receiveCurrency: { countryCode: "gb", currencyCode: "GBP" },
        searchParams: createUrlSearchParams({
          amount: "1000.00",
          amountSource: "send",
          from: "USD",
          receiveAmount: "853.02",
          to: "EUR",
        }),
        sendCurrency: { countryCode: "us", currencyCode: "USD" },
      })
    ).toBe("/rate/favorites?amount=1000.00&amountSource=send&from=USD&to=GBP");
  });
});
