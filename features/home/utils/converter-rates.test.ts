import { describe, expect, it } from "vitest";

import { getInitialConverterRates } from "./converter-rates";

describe("getInitialConverterRates", () => {
  it("uses latest rates without waiting for the currency reference", () => {
    expect(
      getInitialConverterRates([
        { date: "2026-06-19", base: "EUR", quote: "USD", rate: 1.171 },
        { date: "2026-06-19", base: "EUR", quote: "GBP", rate: 0.853 },
        { date: "2026-06-19", base: "EUR", quote: "XDR", rate: 0.8 },
      ])
    ).toEqual({
      base: "EUR",
      rates: {
        GBP: 0.853,
        USD: 1.171,
      },
    });
  });
});
