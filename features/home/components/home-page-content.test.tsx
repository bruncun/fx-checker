// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { HomePageContent } from "./home-page-content";

const currencies = [
  { code: "USD", countryCode: "us" as const, name: "United States Dollar" },
  { code: "EUR", countryCode: "eu" as const, name: "Euro" },
  { code: "GBP", countryCode: "gb" as const, name: "British Pound" },
  { code: "JPY", countryCode: "jp" as const, name: "Japanese Yen" },
  { code: "CHF", countryCode: "ch" as const, name: "Swiss Franc" },
  { code: "AUD", countryCode: "au" as const, name: "Australian Dollar" },
  { code: "CAD", countryCode: "ca" as const, name: "Canadian Dollar" },
];

const rates = [
  { date: "2026-06-19", base: "EUR", quote: "USD", rate: 1.171 },
  { date: "2026-06-19", base: "EUR", quote: "GBP", rate: 0.85 },
  { date: "2026-06-19", base: "EUR", quote: "JPY", rate: 183.24 },
  { date: "2026-06-19", base: "EUR", quote: "CHF", rate: 0.94 },
  { date: "2026-06-19", base: "EUR", quote: "AUD", rate: 1.79 },
  { date: "2026-06-19", base: "EUR", quote: "CAD", rate: 1.6 },
];

afterEach(() => {
  cleanup();
});

describe("HomePageContent", () => {
  it("renders the main header and converter with the default currency pair", () => {
    render(<HomePageContent availableCurrencies={currencies} currencyCount={56} rates={rates} />);

    expect(screen.getByRole("link", { name: "FX Checker" })).toBeTruthy();
    expect(screen.getByRole("list", { name: "Exchange rate data stats" }).textContent).toContain(
      "56 Currencies"
    );
    expect(screen.getByRole("button", { name: "Select send currency" }).textContent).toContain(
      "USD"
    );
    expect(screen.getByRole("button", { name: "Select receive currency" }).textContent).toContain(
      "EUR"
    );
    expect(screen.getByText("1 USD = 0.8540 EUR")).toBeTruthy();
  });
});
