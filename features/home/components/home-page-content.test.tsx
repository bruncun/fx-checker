// @vitest-environment jsdom

import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { HomePageContent } from "./home-page-content";

const { routerReplace, testSearchParams } = vi.hoisted(() => ({
  routerReplace: vi.fn(),
  testSearchParams: { current: "" },
}));

const { createFavorite, deleteFavorite } = vi.hoisted(() => ({
  createFavorite: vi.fn(),
  deleteFavorite: vi.fn(),
}));

const { createConversion, deleteAllConversions, deleteConversion } = vi.hoisted(() => ({
  createConversion: vi.fn(),
  deleteAllConversions: vi.fn(),
  deleteConversion: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
    replace: routerReplace,
  }),
  useSearchParams: () => new URLSearchParams(testSearchParams.current),
}));

vi.mock("@/features/favorites/client", () => ({
  createFavorite,
  deleteFavorite,
}));

vi.mock("@/features/conversion-log/client", () => ({
  createConversion,
  deleteAllConversions,
  deleteConversion,
}));

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

const historicalRates = [
  { date: "2026-06-18", base: "EUR", quote: "USD", rate: 1.17 },
  { date: "2026-06-18", base: "EUR", quote: "GBP", rate: 0.849 },
  { date: "2026-06-18", base: "EUR", quote: "JPY", rate: 183.1 },
  { date: "2026-06-18", base: "EUR", quote: "CHF", rate: 0.941 },
  { date: "2026-06-18", base: "EUR", quote: "AUD", rate: 1.78 },
  { date: "2026-06-18", base: "EUR", quote: "CAD", rate: 1.59 },
  ...rates,
];

const liveRates = [
  { pair: "EUR/USD", rate: "1.1710", change: "-0.14%", direction: "down" as const },
  { pair: "USD/JPY", rate: "156.48", change: "+0.04%", direction: "up" as const },
  { pair: "GBP/USD", rate: "1.3776", change: "-0.22%", direction: "down" as const },
  { pair: "USD/CHF", rate: "0.8027", change: "+0.13%", direction: "up" as const },
  { pair: "EUR/GBP", rate: "0.8500", change: "+0.11%", direction: "up" as const },
  { pair: "AUD/USD", rate: "0.6542", change: "+0.08%", direction: "up" as const },
  { pair: "USD/CAD", rate: "1.3664", change: "+0.04%", direction: "up" as const },
];

function createDeferred<T>() {
  let reject!: (reason?: unknown) => void;
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((promiseResolve, promiseReject) => {
    resolve = promiseResolve;
    reject = promiseReject;
  });

  return { promise, reject, resolve };
}

afterEach(() => {
  routerReplace.mockClear();
  createFavorite.mockReset();
  createConversion.mockReset();
  deleteAllConversions.mockReset();
  deleteConversion.mockReset();
  deleteFavorite.mockReset();
  testSearchParams.current = "";
  cleanup();
});

describe("HomePageContent", () => {
  it("renders the main header and converter with the default currency pair", () => {
    render(
      <HomePageContent
        availableCurrencies={currencies}
        currencyCount={56}
        historicalRates={historicalRates}
        liveRates={liveRates}
        rates={rates}
      >
        <section aria-label="Rate details" />
      </HomePageContent>
    );

    expect(screen.getByAltText("FX Checker")).toBeTruthy();
    expect(screen.getByRole("list", { name: "Exchange rate data stats" }).textContent).toContain(
      "56 Currencies"
    );
    expect(screen.getByRole("link", { name: "Sign out" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Select send currency" }).textContent).toContain(
      "USD"
    );
    expect(screen.getByRole("button", { name: "Select receive currency" }).textContent).toContain(
      "EUR"
    );
    expect(screen.getByText("1 USD = 0.8540 EUR")).toBeTruthy();
  });

  it("uses selected currencies from URL state when present", () => {
    testSearchParams.current = "from=GBP&to=USD";

    render(
      <HomePageContent
        availableCurrencies={currencies}
        currencyCount={56}
        historicalRates={historicalRates}
        liveRates={liveRates}
        rates={rates}
      >
        <section aria-label="Rate details" />
      </HomePageContent>
    );

    expect(screen.getByRole("button", { name: "Select send currency" }).textContent).toContain(
      "GBP"
    );
    expect(screen.getByRole("button", { name: "Select receive currency" }).textContent).toContain(
      "USD"
    );
  });

  it("does not replace the URL on initial render when URL state is present", () => {
    testSearchParams.current = "from=GBP&to=USD";

    render(
      <HomePageContent
        availableCurrencies={currencies}
        currencyCount={56}
        historicalRates={historicalRates}
        liveRates={liveRates}
        rates={rates}
      >
        <section aria-label="Rate details" />
      </HomePageContent>
    );

    expect(routerReplace).not.toHaveBeenCalled();
  });

  it("optimistically creates a favorite for the selected converter pair", async () => {
    createFavorite.mockResolvedValue({
      createdAt: "2026-06-19T00:00:00.000Z",
      fromCurrency: "USD",
      id: "favorite-usd-eur",
      toCurrency: "EUR",
    });

    render(
      <HomePageContent
        availableCurrencies={currencies}
        currencyCount={56}
        historicalRates={historicalRates}
        liveRates={liveRates}
        rates={rates}
      >
        <section aria-label="Rate details" />
      </HomePageContent>
    );

    fireEvent.click(screen.getByRole("button", { name: "Favorite USD/EUR" }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Remove USD/EUR from favorites" })).toBeTruthy();
    });
    expect(createFavorite).toHaveBeenCalledWith({ fromCurrency: "USD", toCurrency: "EUR" });
  });

  it("keeps a created favorite optimistic while the API request is pending", async () => {
    const favorite = {
      createdAt: "2026-06-19T00:00:00.000Z",
      fromCurrency: "USD",
      id: "favorite-usd-eur",
      toCurrency: "EUR",
    };
    const deferredFavorite = createDeferred<typeof favorite>();

    createFavorite.mockReturnValue(deferredFavorite.promise);

    render(
      <HomePageContent
        availableCurrencies={currencies}
        currencyCount={56}
        historicalRates={historicalRates}
        liveRates={liveRates}
        rates={rates}
      >
        <section aria-label="Rate details" />
      </HomePageContent>
    );

    fireEvent.click(screen.getByRole("button", { name: "Favorite USD/EUR" }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Remove USD/EUR from favorites" })).toBeTruthy();
    });

    await act(async () => {
      await Promise.resolve();
    });

    expect(screen.getByRole("button", { name: "Remove USD/EUR from favorites" })).toBeTruthy();

    await act(async () => {
      deferredFavorite.resolve(favorite);
      await deferredFavorite.promise;
    });
  });

  it("optimistically deletes an existing converter favorite", async () => {
    deleteFavorite.mockResolvedValue(undefined);

    render(
      <HomePageContent
        availableCurrencies={currencies}
        currencyCount={56}
        favorites={[
          {
            createdAt: "2026-06-19T00:00:00.000Z",
            fromCurrency: "USD",
            id: "favorite-usd-eur",
            toCurrency: "EUR",
          },
        ]}
        historicalRates={historicalRates}
        liveRates={liveRates}
        rates={rates}
      >
        <section aria-label="Rate details" />
      </HomePageContent>
    );

    fireEvent.click(screen.getByRole("button", { name: "Remove USD/EUR from favorites" }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Favorite USD/EUR" })).toBeTruthy();
    });
    expect(deleteFavorite).toHaveBeenCalledWith({ fromCurrency: "USD", toCurrency: "EUR" });
  });

  it("logs the current converter amounts optimistically", async () => {
    createConversion.mockResolvedValue({
      createdAt: "2026-06-19T00:00:00.000Z",
      fromCurrency: "USD",
      id: "conversion-usd-eur",
      receiveAmount: "85.4",
      sendAmount: "100",
      toCurrency: "EUR",
    });

    render(
      <HomePageContent
        availableCurrencies={currencies}
        currencyCount={56}
        historicalRates={historicalRates}
        liveRates={liveRates}
        rates={rates}
      >
        <section aria-label="Rate details" />
      </HomePageContent>
    );

    fireEvent.change(screen.getByRole("textbox", { name: "Send amount" }), {
      target: { value: "100" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Log 100 USD to 85.4 EUR" }));

    await waitFor(() => {
      expect(createConversion).toHaveBeenCalledWith({
        fromCurrency: "USD",
        receiveAmount: "85.4",
        sendAmount: "100",
        toCurrency: "EUR",
      });
    });
  });
});
