import { describe, expect, it } from "vitest";

import { getConverterExchangeRate, normalizeConverterRates } from "./exchange";

const rates = [
  { date: "2026-06-19", base: "EUR", quote: "USD", rate: 1.171 },
  { date: "2026-06-19", base: "EUR", quote: "GBP", rate: 0.853 },
  { date: "2026-06-19", base: "EUR", quote: "XDR", rate: 0.8 },
];

describe("normalizeConverterRates", () => {
  it("keeps the shared base once and filters rates by selectable currency code", () => {
    expect(normalizeConverterRates(rates, ["EUR", "USD", "GBP"])).toEqual({
      base: "EUR",
      rates: {
        GBP: 0.853,
        USD: 1.171,
      },
    });
  });

  it("returns an empty table when rate rows do not use one shared base", () => {
    expect(
      normalizeConverterRates([
        ...rates,
        { date: "2026-06-19", base: "USD", quote: "JPY", rate: 156.48 },
      ])
    ).toEqual({ base: "", rates: {} });
  });
});

describe("getConverterExchangeRate", () => {
  it("derives cross rates from normalized rates", () => {
    const converterRates = normalizeConverterRates(rates);

    expect(getConverterExchangeRate(converterRates, "USD", "GBP")?.toFixed(6)).toBe("0.728437");
  });
});
