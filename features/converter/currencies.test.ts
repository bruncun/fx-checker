import { describe, expect, it } from "vitest";

import { deriveAvailableCurrencies } from "./currencies";

const currencies = [
  { iso_code: "EUR", name: "Euro" },
  { iso_code: "USD", name: "United States Dollar" },
  { iso_code: "JPY", name: "Japanese Yen" },
  { iso_code: "XDR", name: "Special Drawing Rights" },
];

const rates = [
  { date: "2026-06-19", base: "EUR", quote: "USD", rate: 1.171 },
  { date: "2026-06-19", base: "EUR", quote: "XDR", rate: 0.8 },
];

describe("deriveAvailableCurrencies", () => {
  it("keeps endpoint currencies with both rate coverage and a flag asset", () => {
    expect(deriveAvailableCurrencies(currencies, rates)).toEqual([
      { code: "EUR", countryCode: "eu", name: "Euro" },
      { code: "USD", countryCode: "us", name: "United States Dollar" },
    ]);
  });

  it("returns no currencies when rate rows do not use one shared base", () => {
    expect(
      deriveAvailableCurrencies(currencies, [
        ...rates,
        { date: "2026-06-19", base: "USD", quote: "JPY", rate: 156.48 },
      ])
    ).toEqual([]);
  });
});
