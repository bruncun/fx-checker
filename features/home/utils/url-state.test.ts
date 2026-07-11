import { describe, expect, it } from "vitest";

import type { AvailableCurrency } from "@/features/converter/model/currencies";
import {
  createUrlSearchParams,
  getCurrencyCodePairFromParams,
  getCurrencyPairLabelFromParams,
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
});
