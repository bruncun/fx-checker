// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { ComponentProps } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { CompareRatesProvider } from "@/features/compare-rates";
import { ConversionLog, formatRelativeTime } from "./conversion-log";

const availableCurrencies = [
  { code: "USD", countryCode: "us" as const, name: "United States Dollar" },
  { code: "EUR", countryCode: "eu" as const, name: "Euro" },
  { code: "JPY", countryCode: "jp" as const, name: "Japanese Yen" },
];

const rates = [{ date: "2026-06-19", base: "EUR", quote: "USD", rate: 1.25 }];

const conversions = [
  {
    createdAt: "2026-07-01T22:38:21.000Z",
    fromCurrency: "USD",
    id: "conversion-usd-eur",
    receiveAmount: "853.02",
    sendAmount: "1000.00",
    toCurrency: "EUR",
  },
  {
    createdAt: "2026-07-01T22:24:21.000Z",
    fromCurrency: "EUR",
    id: "conversion-eur-jpy",
    receiveAmount: "92490",
    sendAmount: "500.00",
    toCurrency: "JPY",
  },
];

afterEach(cleanup);

function renderConversionLog({
  conversions: selectedConversions = conversions,
  onConversionDelete = vi.fn(),
  onConversionSelect = vi.fn(),
  onConversionsClear = vi.fn(),
}: {
  conversions?: ComponentProps<typeof CompareRatesProvider>["value"]["conversions"];
  onConversionDelete?: ComponentProps<typeof CompareRatesProvider>["value"]["onConversionDelete"];
  onConversionSelect?: ComponentProps<typeof CompareRatesProvider>["value"]["onConversionSelect"];
  onConversionsClear?: ComponentProps<typeof CompareRatesProvider>["value"]["onConversionsClear"];
} = {}) {
  render(
    <CompareRatesProvider
      value={{
        amount: "1000",
        amountSource: "send",
        availableCurrencies,
        conversions: selectedConversions,
        favorites: [],
        historicalRates: rates,
        onCompareCurrencySelect: vi.fn(),
        onConversionCreate: vi.fn(),
        onConversionDelete,
        onConversionsClear,
        onConversionSelect,
        onCurrencyPairSelect: vi.fn(),
        onFavoriteToggle: vi.fn(),
        rates,
        receiveCurrency: { countryCode: "eu", currencyCode: "EUR" },
        sendCurrency: { countryCode: "us", currencyCode: "USD" },
      }}
    >
      <ConversionLog />
    </CompareRatesProvider>
  );
}

describe("ConversionLog", () => {
  it("renders logged conversions with count and formatted amounts", () => {
    renderConversionLog();

    expect(screen.getByRole("region", { name: "Conversion log" })).toBeTruthy();
    expect(screen.getByRole("treegrid", { name: "Conversion Log" })).toBeTruthy();
    expect(screen.getByText("2 Logged")).toBeTruthy();
    expect(screen.getByText("1,000")).toBeTruthy();
    expect(screen.getByText("853.02")).toBeTruthy();
    expect(screen.getByText("92,490")).toBeTruthy();
  });

  it("loads a conversion into the converter when its row is selected", () => {
    const onConversionSelect = vi.fn();

    renderConversionLog({ onConversionSelect });

    fireEvent.click(
      screen.getByRole("row", {
        name: "Load USD/EUR conversion, sent 1,000, received 853.02",
      })
    );

    expect(onConversionSelect).toHaveBeenCalledWith(conversions[0]);
  });

  it("deletes individual conversions and clears all conversions", () => {
    const onConversionDelete = vi.fn();
    const onConversionsClear = vi.fn();

    renderConversionLog({ onConversionDelete, onConversionsClear });

    fireEvent.click(screen.getByRole("button", { name: "Delete USD/EUR conversion" }));
    fireEvent.click(screen.getByRole("button", { name: "Clear all conversions" }));

    expect(onConversionDelete).toHaveBeenCalledWith("conversion-usd-eur");
    expect(onConversionsClear).toHaveBeenCalled();
  });

  it("renders the conversion log empty state when no conversions exist", () => {
    renderConversionLog({ conversions: [] });

    expect(screen.getByText("No conversions logged yet")).toBeTruthy();
    expect(
      screen.getByText(
        /Every conversion is recorded here automatically when you tap LOG CONVERSION/
      )
    ).toBeTruthy();
    expect(screen.getByText(/Your log is private to your account/)).toBeTruthy();
    expect(screen.queryByRole("region", { name: "Conversion log" })).toBeNull();
    expect(screen.queryByRole("treegrid", { name: "Conversion Log" })).toBeNull();
  });

  it("formats relative timestamps for recent and older conversions", () => {
    const now = new Date("2026-07-01T22:58:21.000Z");

    expect(formatRelativeTime("2026-07-01T22:38:21.000Z", now)).toBe("20M");
    expect(formatRelativeTime("2026-07-01T21:58:21.000Z", now)).toBe("1H");
    expect(formatRelativeTime("2026-05-13T12:00:00.000Z", now)).toBe("13 May");
  });
});
