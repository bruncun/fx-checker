// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { Favorite } from "@/features/favorites";
import { CompareRates, getCompareCurrencies } from "./compare-rates";

const { createFavorite, routerRefresh, routerReplace, showDataUnavailableError, testSearchParams } =
  vi.hoisted(() => ({
    createFavorite: vi.fn(),
    routerRefresh: vi.fn(),
    routerReplace: vi.fn(),
    showDataUnavailableError: vi.fn(),
    testSearchParams: { current: "" },
  }));

vi.mock("next/navigation", () => ({
  usePathname: () => "/rate/compare",
  useRouter: () => ({
    refresh: routerRefresh,
    replace: routerReplace,
  }),
  useSearchParams: () => new URLSearchParams(testSearchParams.current),
}));

vi.mock("@/features/favorites/actions", () => ({
  createFavorite,
  deleteFavorite: vi.fn(),
}));

vi.mock("@/features/home/components/use-data-unavailable-error", () => ({
  useDataUnavailableError: () => showDataUnavailableError,
}));

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

afterEach(() => {
  createFavorite.mockReset();
  routerRefresh.mockClear();
  routerReplace.mockClear();
  showDataUnavailableError.mockClear();
  testSearchParams.current = "";
  cleanup();
});

function renderCompareRates({
  amount = "1000",
  favorites = [],
}: {
  amount?: string;
  favorites?: Favorite[];
} = {}) {
  render(
    <CompareRates
      amount={amount}
      amountSource="send"
      availableCurrencies={availableCurrencies}
      favoritesPromise={fulfilledPromise(favorites)}
      rates={rates}
      receiveCurrency={{ countryCode: "eu", currencyCode: "EUR" }}
      sendCurrency={{ countryCode: "us", currencyCode: "USD" }}
    />
  );
}

function fulfilledPromise<T>(value: T) {
  return Object.assign(Promise.resolve(value), {
    status: "fulfilled" as const,
    value,
  });
}

describe("CompareRates", () => {
  it("renders the preset compare currencies from the active send amount", () => {
    renderCompareRates({
      favorites: [
        {
          createdAt: "2026-06-19T00:00:00.000Z",
          fromCurrency: "USD",
          id: "favorite-gbp",
          toCurrency: "GBP",
        },
      ],
    });

    expect(screen.getByRole("region", { name: "Compare" })).toBeTruthy();
    expect(screen.getByRole("treegrid", { name: /Multi-Currency/ })).toBeTruthy();
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

  it("creates a favorite when a compare favorite is toggled", () => {
    createFavorite.mockResolvedValue({
      createdAt: "2026-06-19T00:00:00.000Z",
      fromCurrency: "USD",
      id: "favorite-usd-gbp",
      toCurrency: "GBP",
    });

    renderCompareRates();

    fireEvent.click(screen.getByRole("button", { name: "Favorite USD/GBP" }));

    expect(createFavorite).toHaveBeenCalledWith({ fromCurrency: "USD", toCurrency: "GBP" });
  });

  it("shows the data unavailable error when a compare favorite toggle fails", async () => {
    createFavorite.mockRejectedValue(new Error("Supabase failed"));

    renderCompareRates();

    fireEvent.click(screen.getByRole("button", { name: "Favorite USD/GBP" }));

    await waitFor(() => {
      expect(showDataUnavailableError).toHaveBeenCalled();
    });
  });

  it("renders the comparison empty state when no converter amount is entered", () => {
    renderCompareRates({ amount: "0" });

    expect(screen.getByText("No comparison available")).toBeTruthy();
    expect(screen.getByText(/Enter an amount in SEND above to see what your money/)).toBeTruthy();
    expect(screen.getByText(/is worth in other currencies/)).toBeTruthy();
    expect(screen.queryByRole("region", { name: "Compare" })).toBeNull();
    expect(screen.queryByRole("treegrid", { name: /Multi-Currency/ })).toBeNull();
  });

  it("selects compare rows to load the receive currency into the converter", () => {
    renderCompareRates();

    const gbpRow = screen.getByRole("row", {
      name: "Use USD/GBP in converter, 736 GBP at 0.7360",
    });

    fireEvent.click(gbpRow);

    expect(routerReplace).toHaveBeenCalledWith("/rate/compare?from=USD&to=GBP", {
      scroll: false,
    });
  });

  it("supports row-first treegrid keyboard navigation and selection", () => {
    renderCompareRates();

    const gbpRow = screen.getByRole("row", {
      name: "Use USD/GBP in converter, 736 GBP at 0.7360",
    });
    const jpyRow = screen.getByRole("row", {
      name: "Use USD/JPY in converter, 157,910 JPY at 157.9100",
    });

    expect(gbpRow.tabIndex).toBe(0);
    expect(jpyRow.tabIndex).toBe(-1);

    gbpRow.focus();
    fireEvent.keyDown(gbpRow, { key: "ArrowDown" });

    expect(document.activeElement).toBe(jpyRow);
    expect(gbpRow.tabIndex).toBe(-1);
    expect(jpyRow.tabIndex).toBe(0);

    fireEvent.keyDown(jpyRow, { key: "Enter" });

    expect(routerReplace).toHaveBeenCalledWith("/rate/compare?from=USD&to=JPY", {
      scroll: false,
    });
  });

  it("moves from a focused row to the favorite action and back", () => {
    createFavorite.mockResolvedValue({
      createdAt: "2026-06-19T00:00:00.000Z",
      fromCurrency: "USD",
      id: "favorite-usd-gbp",
      toCurrency: "GBP",
    });

    renderCompareRates();

    const gbpRow = screen.getByRole("row", {
      name: "Use USD/GBP in converter, 736 GBP at 0.7360",
    });
    const favoriteButton = screen.getByRole("button", { name: "Favorite USD/GBP" });

    gbpRow.focus();
    fireEvent.keyDown(gbpRow, { key: "ArrowRight" });

    expect(document.activeElement).toBe(favoriteButton);
    expect(favoriteButton.tabIndex).toBe(-1);

    fireEvent.keyDown(favoriteButton, { key: "Enter" });
    fireEvent.click(favoriteButton);

    expect(createFavorite).toHaveBeenCalledWith({ fromCurrency: "USD", toCurrency: "GBP" });
    expect(routerReplace).not.toHaveBeenCalled();

    fireEvent.keyDown(favoriteButton, { key: "Escape" });

    expect(document.activeElement).toBe(gbpRow);
  });

  it("tabs from a focused row into the favorite action and shifts tab back to the row", () => {
    renderCompareRates();

    const gbpRow = screen.getByRole("row", {
      name: "Use USD/GBP in converter, 736 GBP at 0.7360",
    });
    const favoriteButton = screen.getByRole("button", { name: "Favorite USD/GBP" });

    gbpRow.focus();
    fireEvent.keyDown(gbpRow, { key: "Tab" });

    expect(document.activeElement).toBe(favoriteButton);

    fireEvent.keyDown(favoriteButton, { key: "Tab", shiftKey: true });

    expect(document.activeElement).toBe(gbpRow);
  });

  it("prefers preset currencies and skips the send currency", () => {
    expect(
      getCompareCurrencies(availableCurrencies, "GBP").map((currency) => currency.code)
    ).toEqual(["JPY", "CHF", "CAD", "AUD", "INR", "CNY", "BDT", "USD"]);
  });
});
