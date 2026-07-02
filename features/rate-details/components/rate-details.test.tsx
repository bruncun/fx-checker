// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { CompareRatesProvider } from "@/features/compare-rates";
import { RateDetails } from "./rate-details";

const { testPathname, testSearchParams } = vi.hoisted(() => ({
  testPathname: { current: "/" },
  testSearchParams: { current: "" },
}));

vi.mock("next/navigation", () => ({
  usePathname: () => testPathname.current,
  useSearchParams: () => new URLSearchParams(testSearchParams.current),
}));

afterEach(() => {
  testPathname.current = "/";
  testSearchParams.current = "";
  cleanup();
});

function renderRateDetails(children: ReactNode, favoritesCount = 0) {
  render(
    <CompareRatesProvider
      value={{
        amount: "1000",
        amountSource: "send",
        availableCurrencies: [],
        conversions: [],
        favorites: Array.from({ length: favoritesCount }, (_, index) => ({
          createdAt: "2026-06-19T00:00:00.000Z",
          fromCurrency: "USD",
          id: `favorite-${index}`,
          toCurrency: "EUR",
        })),
        historicalRates: [],
        onCompareCurrencySelect: vi.fn(),
        onConversionCreate: vi.fn(),
        onConversionDelete: vi.fn(),
        onConversionsClear: vi.fn(),
        onConversionSelect: vi.fn(),
        onCurrencyPairSelect: vi.fn(),
        onFavoriteToggle: vi.fn(),
        rates: [],
        receiveCurrency: { countryCode: "eu", currencyCode: "EUR" },
        sendCurrency: { countryCode: "us", currencyCode: "USD" },
      }}
    >
      <RateDetails>{children}</RateDetails>
    </CompareRatesProvider>
  );
}

describe("RateDetails", () => {
  it("owns rate section navigation and renders history as the default section", () => {
    renderRateDetails(<section aria-label="Rate history" />);

    expect(screen.getByRole("navigation", { name: "Rate details sections" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Rate details sections: History" })).toBeTruthy();
    expect(screen.getByRole("region", { name: "Rate history" })).toBeTruthy();
  });

  it("links nested sections through route segments without scrolling the page", () => {
    testSearchParams.current = "from=GBP&to=USD";

    renderRateDetails(<section aria-label="Rate history" />, 3);

    fireEvent.click(screen.getByRole("button", { name: "Rate details sections: History" }));
    const compareLink = screen.getByRole("link", { name: "Compare" });

    expect(compareLink.getAttribute("href")).toBe("/rate/compare?from=GBP&to=USD");
    expect(screen.getByRole("link", { name: "Favorites, 3" })).toBeTruthy();
  });

  it("moves focus through the mobile menu without activating a route", () => {
    renderRateDetails(<section aria-label="Rate history" />);

    fireEvent.click(screen.getByRole("button", { name: "Rate details sections: History" }));
    const historyLink = screen.getByRole("link", { name: "History" });

    historyLink.focus();
    fireEvent.keyDown(historyLink, { key: "ArrowDown" });

    expect(document.activeElement).toBe(screen.getByRole("link", { name: "Compare" }));
  });

  it("renders the selected nested section from the route", () => {
    testPathname.current = "/rate/compare";

    renderRateDetails(<section aria-label="Compare" />);

    expect(screen.getByRole("button", { name: "Rate details sections: Compare" })).toBeTruthy();
    expect(screen.queryByRole("region", { name: "Rate history" })).toBeNull();
    expect(screen.getByRole("region", { name: "Compare" })).toBeTruthy();
  });

  it("renders desktop section tabs as route links", () => {
    testPathname.current = "/rate/compare";
    testSearchParams.current = "from=GBP&to=USD";

    renderRateDetails(<section aria-label="Compare" />, 4);

    const historyTab = screen.getByRole("tab", { name: "History" });
    const compareTab = screen.getByRole("tab", { name: "Compare" });
    const favoritesTab = screen.getByRole("tab", { name: "Favorites, 4" });

    expect(historyTab.getAttribute("href")).toBe("/?from=GBP&to=USD");
    expect(compareTab.getAttribute("href")).toBe("/rate/compare?from=GBP&to=USD");
    expect(favoritesTab.getAttribute("href")).toBe("/rate/favorites?from=GBP&to=USD");
  });
});
