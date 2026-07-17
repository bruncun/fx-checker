// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { Favorite } from "@/features/favorites/model/favorites";
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

vi.mock("@/features/favorites/api/client-actions", () => ({
  createFavorite,
  deleteFavorite: vi.fn(),
}));

vi.mock("@/features/home/hooks/use-data-unavailable-error", () => ({
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
  document.getElementById("converter")?.remove();
  delete (Element.prototype as { scrollIntoView?: Element["scrollIntoView"] }).scrollIntoView;
  cleanup();
  vi.restoreAllMocks();
});

function renderCompareRates({
  amount = "1000",
  favorites = [],
}: {
  amount?: string;
  favorites?: Favorite[];
} = {}) {
  return render(
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

function getRateRow(rowId: string) {
  const row = document.querySelector<HTMLElement>(`[data-rate-details-row-id="${rowId}"]`);

  if (!row) {
    throw new Error(`Expected rate row ${rowId} to be rendered`);
  }

  return row;
}

function getRateCell(rowId: string, cellIndex: number) {
  const cell = getRateRow(rowId).querySelectorAll<HTMLElement>("[data-rate-details-cell]")[
    cellIndex
  ];

  if (!cell) {
    throw new Error(`Expected rate row ${rowId} cell ${cellIndex} to be rendered`);
  }

  return cell;
}

function getRateAction(rowId: string) {
  const action = getRateRow(rowId).querySelector<HTMLButtonElement>("[data-rate-details-action]");

  if (!action) {
    throw new Error(`Expected rate row ${rowId} action to be rendered`);
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

  return { converter, scrollIntoView };
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

    expect(screen.getByRole("table", { name: "Rates" })).toBeTruthy();
    expect(screen.getByText("Multi-Currency")).toBeTruthy();
    expect(screen.getByText("1,000")).toBeTruthy();
    expect(screen.getByText("From USD")).toBeTruthy();
    expect(screen.getByText("8 Pairs")).toBeTruthy();
    expect(screen.getByText("GBP")).toBeTruthy();
    expect(screen.getByText("British Pound")).toBeTruthy();
    expect(screen.getByText("736")).toBeTruthy();
    expect(screen.getByText("@ 0.7360")).toBeTruthy();
    expect(screen.queryByRole("img", { name: "United Kingdom" })).toBeNull();
    expect(getRateRow("GBP").getAttribute("aria-label")).toBe("Select GBP");
    expect(getRateAction("GBP").getAttribute("aria-label")).toBe("Remove");
    expect(getRateAction("CHF").getAttribute("aria-label")).toBe("Favorite");
  });

  it("uses live URL amount params without waiting for server props to change", () => {
    const { rerender } = renderCompareRates({ amount: "1000" });

    expect(screen.getByText("1,000")).toBeTruthy();
    expect(getRateRow("GBP").textContent).toContain("736");

    testSearchParams.current = "from=USD&to=EUR&amount=250&amountSource=send";

    rerender(
      <CompareRates
        amount="1000"
        amountSource="send"
        availableCurrencies={availableCurrencies}
        favoritesPromise={fulfilledPromise([])}
        rates={rates}
        receiveCurrency={{ countryCode: "eu", currencyCode: "EUR" }}
        sendCurrency={{ countryCode: "us", currencyCode: "USD" }}
      />
    );

    expect(screen.getByText("250")).toBeTruthy();
    expect(getRateRow("GBP").textContent).toContain("184");
    expect(routerRefresh).not.toHaveBeenCalled();
  });

  it("creates a favorite when a compare favorite is toggled", () => {
    createFavorite.mockResolvedValue({
      createdAt: "2026-06-19T00:00:00.000Z",
      fromCurrency: "USD",
      id: "favorite-usd-gbp",
      toCurrency: "GBP",
    });

    renderCompareRates();

    fireEvent.click(getRateAction("GBP"));

    expect(createFavorite).toHaveBeenCalledWith({ fromCurrency: "USD", toCurrency: "GBP" });
  });

  it("shows the data unavailable error when a compare favorite toggle fails", async () => {
    createFavorite.mockRejectedValue(new Error("Supabase failed"));

    renderCompareRates();

    fireEvent.click(getRateAction("GBP"));

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
    expect(screen.queryByRole("table", { name: "Rates" })).toBeNull();
  });

  it("selects compare rows to load the receive currency into the converter", () => {
    renderCompareRates();

    const gbpRow = getRateRow("GBP");

    fireEvent.click(gbpRow);

    expect(routerReplace).toHaveBeenCalledWith("/rate/compare?from=USD&to=GBP", {
      scroll: false,
    });
  });

  it("scrolls the converter into view when compare selection would otherwise be hard to notice", () => {
    const { scrollIntoView } = renderConverterTarget({
      bottom: 200,
      height: 600,
      top: -400,
    });
    renderCompareRates();

    fireEvent.click(getRateRow("GBP"));

    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: "smooth", block: "start" });
  });

  it("does not scroll the converter when enough of it is already visible", () => {
    const { scrollIntoView } = renderConverterTarget({
      bottom: 650,
      height: 600,
      top: 50,
    });
    renderCompareRates();

    fireEvent.click(getRateRow("GBP"));

    expect(scrollIntoView).not.toHaveBeenCalled();
  });

  it("supports row-first table keyboard navigation and selection", () => {
    renderCompareRates();

    const gbpCurrencyCell = getRateCell("GBP", 0);
    const jpyCurrencyCell = getRateCell("JPY", 0);

    expect(gbpCurrencyCell.tabIndex).toBe(0);
    expect(jpyCurrencyCell.tabIndex).toBe(-1);

    gbpCurrencyCell.focus();
    fireEvent.keyDown(gbpCurrencyCell, { key: "ArrowDown" });

    expect(document.activeElement).toBe(jpyCurrencyCell);
    expect(gbpCurrencyCell.tabIndex).toBe(-1);
    expect(jpyCurrencyCell.tabIndex).toBe(0);

    fireEvent.keyDown(jpyCurrencyCell, { key: "Enter" });

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

    const currencyCell = getRateCell("GBP", 0);
    const favoriteButton = getRateAction("GBP");

    currencyCell.focus();
    fireEvent.keyDown(currencyCell, { key: "ArrowRight" });

    expect(document.activeElement).toBe(favoriteButton);
    expect(favoriteButton.tabIndex).toBe(0);

    fireEvent.click(favoriteButton);

    expect(createFavorite).toHaveBeenCalledWith({ fromCurrency: "USD", toCurrency: "GBP" });
    expect(routerReplace).not.toHaveBeenCalled();

    fireEvent.keyDown(favoriteButton, { key: "Escape" });

    expect(document.activeElement).toBe(currencyCell);
  });

  it("tabs from the row entry point to the action without stopping on data cells", () => {
    renderCompareRates();

    const currencyCell = getRateCell("GBP", 0);
    const conversionCell = getRateCell("GBP", 1);
    const favoriteButton = getRateAction("GBP");

    expect(conversionCell.tabIndex).toBe(-1);
    expect(favoriteButton.tabIndex).toBe(0);

    currencyCell.focus();
    fireEvent.keyDown(currencyCell, { key: "Tab" });

    expect(document.activeElement).toBe(favoriteButton);

    fireEvent.keyDown(favoriteButton, { key: "Tab", shiftKey: true });

    expect(document.activeElement).toBe(currencyCell);
  });

  it("prefers preset currencies and skips the send currency", () => {
    expect(
      getCompareCurrencies(availableCurrencies, "GBP").map((currency) => currency.code)
    ).toEqual(["JPY", "CHF", "CAD", "AUD", "INR", "CNY", "BDT", "USD"]);
  });
});
