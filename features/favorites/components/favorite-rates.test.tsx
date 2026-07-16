// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { act, type ComponentProps } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { addOptimisticFavorite } from "@/features/favorites/stores/optimistic-favorites";
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

vi.mock("@/features/favorites/api/client", () => ({
  deleteFavorite,
}));

vi.mock("@/features/home/hooks/use-data-unavailable-error", () => ({
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

const latestRates = [
  { base: "EUR", date: "2026-06-19", quote: "USD", rate: 1.25 },
  { base: "EUR", date: "2026-06-19", quote: "GBP", rate: 0.92 },
];

const liveRateHistoryRates = [
  { base: "EUR", date: "2026-06-18", quote: "USD", rate: 1.24 },
  { base: "EUR", date: "2026-06-18", quote: "GBP", rate: 0.91 },
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
  vi.useRealTimers();
  deleteFavorite.mockReset();
  routerRefresh.mockClear();
  routerReplace.mockClear();
  showDataUnavailableError.mockClear();
  testSearchParams.current = "";
  document.getElementById("converter")?.remove();
  delete (Element.prototype as { scrollIntoView?: Element["scrollIntoView"] }).scrollIntoView;
  cleanup();
});

function renderFavoriteRates({
  favorites: selectedFavorites = favorites,
}: {
  favorites?: ComponentProps<typeof FavoriteRates>["favorites"];
} = {}) {
  return render(
    <FavoriteRates
      availableCurrencies={availableCurrencies}
      favorites={selectedFavorites}
      latestRates={latestRates}
      liveRates={favoriteRates}
      liveRateHistoryRates={liveRateHistoryRates}
    />
  );
}

function getFavoriteRow(rowId: string) {
  const row = document.querySelector<HTMLElement>(`[data-rate-details-row-id="${rowId}"]`);

  if (!row) {
    throw new Error(`Expected favorite row ${rowId} to be rendered`);
  }

  return row;
}

function getFavoriteCell(rowId: string, cellIndex: number) {
  const cell = getFavoriteRow(rowId).querySelectorAll<HTMLElement>("[data-rate-details-cell]")[
    cellIndex
  ];

  if (!cell) {
    throw new Error(`Expected favorite row ${rowId} cell ${cellIndex} to be rendered`);
  }

  return cell;
}

function getFavoriteAction(rowId: string) {
  const action = getFavoriteRow(rowId).querySelector<HTMLButtonElement>(
    "[data-rate-details-action]"
  );

  if (!action) {
    throw new Error(`Expected favorite row ${rowId} action to be rendered`);
  }

  return action;
}

function renderConverterTarget(rect: Partial<DOMRect>) {
  const converter = document.createElement("section");
  const scrollIntoView = vi.fn();

  converter.id = "converter";
  converter.getBoundingClientRect = vi.fn(
    () =>
      ({
        bottom: 0,
        height: 0,
        left: 0,
        right: 0,
        top: 0,
        width: 0,
        x: 0,
        y: 0,
        toJSON: () => ({}),
        ...rect,
      }) satisfies DOMRect
  );
  Element.prototype.scrollIntoView = scrollIntoView;
  document.body.append(converter);

  return { scrollIntoView };
}

describe("FavoriteRates", () => {
  it("renders favorite pairs with rates and the real favorites count", () => {
    renderFavoriteRates();

    expect(screen.getByRole("table", { name: "Pinned Pairs" })).toBeTruthy();
    expect(screen.getByText("2 Favorites")).toBeTruthy();
    expect(getFavoriteRow("USD/EUR").textContent).toContain("0.8000");
    expect(screen.getByText("0.8000")).toBeTruthy();
    expect(screen.getByText("-0.80%")).toBeTruthy();
    expect(getFavoriteAction("USD/EUR").getAttribute("aria-label")).toBe("Remove");
    expect(getFavoriteAction("USD/EUR").querySelectorAll("svg")).toHaveLength(1);
  });

  it("selects a favorite pair and removes it from the star action", () => {
    vi.useFakeTimers();
    deleteFavorite.mockResolvedValue(undefined);

    renderFavoriteRates();

    const row = getFavoriteRow("USD/EUR");

    fireEvent.click(row);

    expect(routerReplace).toHaveBeenCalledWith("/rate/favorites?from=USD&to=EUR", {
      scroll: false,
    });

    fireEvent.click(getFavoriteAction("USD/EUR"));

    expect(row.className).toContain("fx-list-row-out");
    expect(deleteFavorite).toHaveBeenCalledWith({ fromCurrency: "USD", toCurrency: "EUR" });

    act(() => {
      vi.advanceTimersByTime(160);
    });

    expect(document.querySelector('[data-rate-details-row-id="USD/EUR"]')).toBeNull();
  });

  it("scrolls the converter into view when favorite selection would otherwise be hard to notice", () => {
    const { scrollIntoView } = renderConverterTarget({
      bottom: 200,
      height: 600,
      top: -400,
    });
    renderFavoriteRates();

    fireEvent.click(getFavoriteRow("USD/EUR"));

    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: "smooth", block: "start" });
  });

  it("does not scroll the converter when enough of it is already visible", () => {
    const { scrollIntoView } = renderConverterTarget({
      bottom: 650,
      height: 600,
      top: 50,
    });
    renderFavoriteRates();

    fireEvent.click(getFavoriteRow("USD/EUR"));

    expect(scrollIntoView).not.toHaveBeenCalled();
  });

  it("shows the data unavailable error when removing a favorite fails", async () => {
    deleteFavorite.mockRejectedValue(new Error("Supabase failed"));

    renderFavoriteRates();

    fireEvent.click(getFavoriteAction("USD/EUR"));

    await waitFor(() => {
      expect(showDataUnavailableError).toHaveBeenCalled();
    });
  });

  it("animates into the empty state when the last favorite exits", () => {
    vi.useFakeTimers();
    deleteFavorite.mockResolvedValue(undefined);

    renderFavoriteRates({ favorites: [favorites[0]] });

    fireEvent.click(getFavoriteAction("USD/EUR"));

    act(() => {
      vi.advanceTimersByTime(160);
    });

    expect(screen.getByText("No pinned pairs yet").parentElement?.className).toContain(
      "fx-state-in"
    );
  });

  it("renders the pinned pairs empty state when no favorites exist", () => {
    renderFavoriteRates({ favorites: [] });

    expect(screen.getByText("No pinned pairs yet")).toBeTruthy();
    expect(screen.getByText(/Pin a pair to track its rate here. Tap the star/)).toBeTruthy();
    expect(screen.getByText(/icon on any conversion or comparison row/)).toBeTruthy();
    expect(screen.queryByRole("region", { name: "Favorites" })).toBeNull();
    expect(screen.queryByRole("table", { name: "Pinned Pairs" })).toBeNull();
  });

  it("animates the first favorite row when favorites transition from empty to populated", () => {
    vi.useFakeTimers();

    const { rerender } = renderFavoriteRates({ favorites: [] });

    expect(screen.getByText("No pinned pairs yet").parentElement?.className).not.toContain(
      "fx-state-in"
    );

    rerender(
      <FavoriteRates
        availableCurrencies={availableCurrencies}
        favorites={[favorites[0]]}
        latestRates={latestRates}
        liveRates={favoriteRates}
        liveRateHistoryRates={liveRateHistoryRates}
      />
    );

    const tableContainer = screen.getByRole("table", { name: "Pinned Pairs" }).parentElement;
    const row = getFavoriteRow("USD/EUR");

    expect(tableContainer?.className).toContain("fx-state-in");
    expect(row.className).toContain("fx-list-row-in");

    act(() => {
      vi.advanceTimersByTime(160);
    });

    expect(row.className).not.toContain("fx-list-row-in");
  });

  it("renders an optimistic favorite row before the server live rates refresh", () => {
    renderFavoriteRates({ favorites: [] });

    act(() => {
      addOptimisticFavorite({
        createdAt: "2026-06-19T00:00:00.000Z",
        fromCurrency: "USD",
        id: "optimistic:USD/GBP",
        toCurrency: "GBP",
      });
    });

    expect(screen.getByText("1 Favorites")).toBeTruthy();
    expect(getFavoriteRow("USD/GBP").textContent).toContain("0.7360");
  });

  it("moves from a focused favorite row to the star action and back", () => {
    renderFavoriteRates();

    const pairCell = getFavoriteCell("USD/EUR", 0);
    const rateCell = getFavoriteCell("USD/EUR", 1);
    const favoriteButton = getFavoriteAction("USD/EUR");

    expect(rateCell.tabIndex).toBe(-1);
    expect(favoriteButton.tabIndex).toBe(0);

    pairCell.focus();
    fireEvent.keyDown(pairCell, { key: "ArrowRight" });

    expect(document.activeElement).toBe(favoriteButton);
    expect(favoriteButton.tabIndex).toBe(0);

    fireEvent.keyDown(favoriteButton, { key: "Escape" });

    expect(document.activeElement).toBe(pairCell);
  });
});
