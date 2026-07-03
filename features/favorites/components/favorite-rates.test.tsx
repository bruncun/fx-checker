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

const favoriteRates = [
  { pair: "USD/EUR", rate: "0.8000", change: "-0.80%", direction: "down" as const },
  { pair: "GBP/USD", rate: "1.3587", change: "+0.61%", direction: "up" as const },
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
  favorites: selectedFavorites = favorites,
  onCurrencyPairSelect = vi.fn(),
  onFavoriteToggle = vi.fn(),
}: {
  favorites?: ComponentProps<typeof CompareRatesProvider>["value"]["favorites"];
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
        conversions: [],
        favoriteRates,
        favorites: selectedFavorites,
        onCompareCurrencySelect: vi.fn(),
        onConversionCreate: vi.fn(),
        onConversionDelete: vi.fn(),
        onConversionsClear: vi.fn(),
        onConversionSelect: vi.fn(),
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

  it("renders the pinned pairs empty state when no favorites exist", () => {
    renderFavoriteRates({ favorites: [] });

    expect(screen.getByText("No pinned pairs yet")).toBeTruthy();
    expect(screen.getByText(/Pin a pair to track its rate here. Tap the star/)).toBeTruthy();
    expect(screen.getByText(/icon on any conversion or comparison row/)).toBeTruthy();
    expect(screen.queryByRole("region", { name: "Favorites" })).toBeNull();
    expect(screen.queryByRole("treegrid", { name: "Pinned Pairs" })).toBeNull();
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
