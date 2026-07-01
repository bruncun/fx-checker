// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { CompareRatesProvider } from "./compare-rates-context";
import { CompareRates, getCompareCurrencies } from "./compare-rates";

const availableCurrencies = [
  { code: "USD", countryCode: "us" as const, name: "United States Dollar" },
  { code: "EUR", countryCode: "eu" as const, name: "Euro" },
  { code: "GBP", countryCode: "gb" as const, name: "British Pound" },
  { code: "JPY", countryCode: "jp" as const, name: "Japanese Yen" },
  { code: "CHF", countryCode: "ch" as const, name: "Swiss Franc" },
  { code: "CAD", countryCode: "ca" as const, name: "Canadian Dollar" },
  { code: "AUD", countryCode: "au" as const, name: "Australian Dollar" },
  { code: "INR", countryCode: "in" as const, name: "Indian Rupee" },
  { code: "CNY", countryCode: "cn" as const, name: "Chinese Yuan" },
  { code: "BDT", countryCode: "bd" as const, name: "Bangladeshi Taka" },
];

const rates = [
  { date: "2026-06-19", base: "EUR", quote: "USD", rate: 1.25 },
  { date: "2026-06-19", base: "EUR", quote: "GBP", rate: 0.92 },
  { date: "2026-06-19", base: "EUR", quote: "JPY", rate: 197.3875 },
  { date: "2026-06-19", base: "EUR", quote: "CHF", rate: 1.13725 },
  { date: "2026-06-19", base: "EUR", quote: "CAD", rate: 1.726875 },
  { date: "2026-06-19", base: "EUR", quote: "AUD", rate: 1.7341875 },
  { date: "2026-06-19", base: "EUR", quote: "INR", rate: 118.6375 },
  { date: "2026-06-19", base: "EUR", quote: "CNY", rate: 9.0125 },
  { date: "2026-06-19", base: "EUR", quote: "BDT", rate: 153.65 },
];

afterEach(cleanup);

describe("CompareRates", () => {
  it("renders the preset compare currencies from the active send amount", () => {
    render(
      <CompareRatesProvider
        value={{
          amount: "1000",
          amountSource: "send",
          availableCurrencies,
          favorites: [
            {
              createdAt: "2026-06-19T00:00:00.000Z",
              fromCurrency: "USD",
              id: "favorite-gbp",
              toCurrency: "GBP",
            },
          ],
          onFavoriteToggle: vi.fn(),
          rates,
          receiveCurrency: { countryCode: "eu", currencyCode: "EUR" },
          sendCurrency: { countryCode: "us", currencyCode: "USD" },
        }}
      >
        <CompareRates />
      </CompareRatesProvider>
    );

    expect(screen.getByRole("region", { name: "Compare" })).toBeTruthy();
    expect(screen.getByText("Multi-Currency")).toBeTruthy();
    expect(screen.getByText("1,000")).toBeTruthy();
    expect(screen.getByText("From USD")).toBeTruthy();
    expect(screen.getByText("8 Pairs")).toBeTruthy();
    expect(screen.getByText("GBP")).toBeTruthy();
    expect(screen.getByText("British Pound")).toBeTruthy();
    expect(screen.getByText("736")).toBeTruthy();
    expect(screen.getByText("@ 0.7360")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Remove USD/GBP from favorites" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Favorite USD/CHF" })).toBeTruthy();
  });

  it("notifies when a compare favorite is toggled", () => {
    const onFavoriteToggle = vi.fn();

    render(
      <CompareRatesProvider
        value={{
          amount: "1000",
          amountSource: "send",
          availableCurrencies,
          favorites: [],
          onFavoriteToggle,
          rates,
          receiveCurrency: { countryCode: "eu", currencyCode: "EUR" },
          sendCurrency: { countryCode: "us", currencyCode: "USD" },
        }}
      >
        <CompareRates />
      </CompareRatesProvider>
    );

    fireEvent.click(screen.getByRole("button", { name: "Favorite USD/GBP" }));

    expect(onFavoriteToggle).toHaveBeenCalledWith({ fromCurrency: "USD", toCurrency: "GBP" });
  });

  it("prefers preset currencies and skips the send currency", () => {
    expect(
      getCompareCurrencies(availableCurrencies, "GBP").map((currency) => currency.code)
    ).toEqual(["JPY", "CHF", "CAD", "AUD", "INR", "CNY", "BDT", "USD"]);
  });
});
