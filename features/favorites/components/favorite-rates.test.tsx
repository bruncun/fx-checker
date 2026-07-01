// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { ComponentProps } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { CompareRatesProvider } from "@/features/compare-rates";
import { FavoriteRates } from "./favorite-rates";

const availableCurrencies = [
  { code: "USD", countryCode: "us" as const, name: "United States Dollar" },
  { code: "EUR", countryCode: "eu" as const, name: "Euro" },
  { code: "GBP", countryCode: "gb" as const, name: "British Pound" },
];

const rates = [
  { date: "2026-06-19", base: "EUR", quote: "USD", rate: 1.25 },
  { date: "2026-06-19", base: "EUR", quote: "GBP", rate: 0.92 },
];

const historicalRates = [
  { date: "2026-06-18", base: "EUR", quote: "USD", rate: 1.24 },
  { date: "2026-06-18", base: "EUR", quote: "GBP", rate: 0.91 },
  ...rates,
];

const favorites = [
  {
    createdAt: "2026-06-19T00:00:00.000Z",
    fromCurrency: "USD",
    id: "favorite-usd-eur",
    toCurrency: "EUR",
  },
  {
    createdAt: "2026-06-19T00:00:00.000Z",
    fromCurrency: "GBP",
    id: "favorite-gbp-usd",
    toCurrency: "USD",
  },
];

afterEach(cleanup);

function renderFavoriteRates({
  onCurrencyPairSelect = vi.fn(),
  onFavoriteToggle = vi.fn(),
}: {
  onCurrencyPairSelect?: ComponentProps<
    typeof CompareRatesProvider
  >["value"]["onCurrencyPairSelect"];
  onFavoriteToggle?: ComponentProps<typeof CompareRatesProvider>["value"]["onFavoriteToggle"];
} = {}) {
  render(
    <CompareRatesProvider
      value={{
        amount: "1000",
        amountSource: "send",
        availableCurrencies,
        favorites,
        historicalRates,
        onCompareCurrencySelect: vi.fn(),
        onCurrencyPairSelect,
        onFavoriteToggle,
        rates,
        receiveCurrency: { countryCode: "eu", currencyCode: "EUR" },
        sendCurrency: { countryCode: "us", currencyCode: "USD" },
      }}
    >
      <FavoriteRates />
    </CompareRatesProvider>
  );
}

describe("FavoriteRates", () => {
  it("renders favorite pairs with rates and the real favorites count", () => {
    renderFavoriteRates();

    expect(screen.getByRole("region", { name: "Favorites" })).toBeTruthy();
    expect(screen.getByRole("treegrid", { name: "Pinned Pairs" })).toBeTruthy();
    expect(screen.getByText("2 Favorites")).toBeTruthy();
    expect(
      screen.getByRole("row", {
        name: "Use USD/EUR in converter, rate 0.8000, down -0.80%",
      })
    ).toBeTruthy();
    expect(screen.getByText("0.8000")).toBeTruthy();
    expect(screen.getByText("-0.80%")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Remove USD/EUR from favorites" })).toBeTruthy();
  });

  it("selects a favorite pair and removes it from the star action", () => {
    const onCurrencyPairSelect = vi.fn();
    const onFavoriteToggle = vi.fn();

    renderFavoriteRates({ onCurrencyPairSelect, onFavoriteToggle });

    const row = screen.getByRole("row", {
      name: "Use USD/EUR in converter, rate 0.8000, down -0.80%",
    });

    fireEvent.click(row);

    expect(onCurrencyPairSelect).toHaveBeenCalledWith({
      receiveCurrency: { countryCode: "eu", currencyCode: "EUR" },
      sendCurrency: { countryCode: "us", currencyCode: "USD" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Remove USD/EUR from favorites" }));

    expect(onFavoriteToggle).toHaveBeenCalledWith({ fromCurrency: "USD", toCurrency: "EUR" });
  });

  it("moves from a focused favorite row to the star action and back", () => {
    renderFavoriteRates();

    const row = screen.getByRole("row", {
      name: "Use USD/EUR in converter, rate 0.8000, down -0.80%",
    });
    const favoriteButton = screen.getByRole("button", {
      name: "Remove USD/EUR from favorites",
    });

    row.focus();
    fireEvent.keyDown(row, { key: "ArrowRight" });

    expect(document.activeElement).toBe(favoriteButton);

    fireEvent.keyDown(favoriteButton, { key: "Escape" });

    expect(document.activeElement).toBe(row);
  });
});
