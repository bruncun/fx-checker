// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ComponentProps } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { FavoriteRates } from "./favorite-rates";

const { deleteFavorite, routerRefresh, routerReplace, showDataUnavailableError, testSearchParams } =
  vi.hoisted(() => ({
    deleteFavorite: vi.fn(),
    routerRefresh: vi.fn(),
    routerReplace: vi.fn(),
    showDataUnavailableError: vi.fn(),
    testSearchParams: { current: "" },
  }));

vi.mock("next/navigation", () => ({
  usePathname: () => "/rate/favorites",
  useRouter: () => ({
    refresh: routerRefresh,
    replace: routerReplace,
  }),
  useSearchParams: () => new URLSearchParams(testSearchParams.current),
}));

vi.mock("@/features/favorites/actions", () => ({
  deleteFavorite,
}));

vi.mock("@/features/home/components/use-data-unavailable-error", () => ({
  useDataUnavailableError: () => showDataUnavailableError,
}));

const availableCurrencies = [
  { code: "USD", countryCode: "us" as const, name: "United States Dollar" },
  { code: "EUR", countryCode: "eu" as const, name: "Euro" },
  { code: "GBP", countryCode: "gb" as const, name: "British Pound" },
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

afterEach(() => {
  deleteFavorite.mockReset();
  routerRefresh.mockClear();
  routerReplace.mockClear();
  showDataUnavailableError.mockClear();
  testSearchParams.current = "";
  cleanup();
});

function renderFavoriteRates({
  favorites: selectedFavorites = favorites,
}: {
  favorites?: ComponentProps<typeof FavoriteRates>["favorites"];
} = {}) {
  render(
    <FavoriteRates
      availableCurrencies={availableCurrencies}
      favorites={selectedFavorites}
      liveRates={favoriteRates}
    />
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
    expect(document.querySelector('img[src="/images/icon-arrow-right-dark.svg"]')).toBeTruthy();
  });

  it("selects a favorite pair and removes it from the star action", () => {
    deleteFavorite.mockResolvedValue(undefined);

    renderFavoriteRates();

    const row = screen.getByRole("row", {
      name: "Use USD/EUR in converter, rate 0.8000, down -0.80%",
    });

    fireEvent.click(row);

    expect(routerReplace).toHaveBeenCalledWith("/rate/favorites?from=USD&to=EUR", {
      scroll: false,
    });

    fireEvent.click(screen.getByRole("button", { name: "Remove USD/EUR from favorites" }));

    expect(deleteFavorite).toHaveBeenCalledWith({ fromCurrency: "USD", toCurrency: "EUR" });
  });

  it("shows the data unavailable error when removing a favorite fails", async () => {
    deleteFavorite.mockRejectedValue(new Error("Supabase failed"));

    renderFavoriteRates();

    fireEvent.click(screen.getByRole("button", { name: "Remove USD/EUR from favorites" }));

    await waitFor(() => {
      expect(showDataUnavailableError).toHaveBeenCalled();
    });
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
