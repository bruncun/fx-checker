// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ComponentProps } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ConversionLog, formatRelativeTime } from "./conversion-log";

const {
  deleteAllConversions,
  deleteConversion,
  routerRefresh,
  routerReplace,
  showDataUnavailableError,
  testSearchParams,
} = vi.hoisted(() => ({
  deleteAllConversions: vi.fn(),
  deleteConversion: vi.fn(),
  routerRefresh: vi.fn(),
  routerReplace: vi.fn(),
  showDataUnavailableError: vi.fn(),
  testSearchParams: { current: "" },
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/rate/log",
  useRouter: () => ({
    refresh: routerRefresh,
    replace: routerReplace,
  }),
  useSearchParams: () => new URLSearchParams(testSearchParams.current),
}));

vi.mock("@/features/conversion-log/client", () => ({
  deleteAllConversions,
  deleteConversion,
}));

vi.mock("@/features/home/components/use-data-unavailable-error", () => ({
  useDataUnavailableError: () => showDataUnavailableError,
}));

const availableCurrencies = [
  { code: "USD", countryCode: "us" as const, name: "United States Dollar" },
  { code: "EUR", countryCode: "eu" as const, name: "Euro" },
  { code: "JPY", countryCode: "jp" as const, name: "Japanese Yen" },
];

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

afterEach(() => {
  deleteAllConversions.mockReset();
  deleteConversion.mockReset();
  routerRefresh.mockClear();
  routerReplace.mockClear();
  showDataUnavailableError.mockClear();
  testSearchParams.current = "";
  cleanup();
});

function renderConversionLog({
  conversions: selectedConversions = conversions,
  isGuestMode = false,
}: {
  conversions?: ComponentProps<typeof ConversionLog>["conversions"];
  isGuestMode?: ComponentProps<typeof ConversionLog>["isGuestMode"];
} = {}) {
  render(
    <ConversionLog
      availableCurrencies={availableCurrencies}
      conversions={selectedConversions}
      isGuestMode={isGuestMode}
    />
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
    renderConversionLog();

    fireEvent.click(
      screen.getByRole("row", {
        name: "Load USD/EUR conversion, sent 1,000, received 853.02",
      })
    );

    expect(routerReplace).toHaveBeenCalledWith(
      "/rate/log?from=USD&to=EUR&amount=1000.00&amountSource=send",
      { scroll: false }
    );
  });

  it("deletes individual conversions and clears all conversions", () => {
    deleteAllConversions.mockResolvedValue(undefined);
    deleteConversion.mockResolvedValue(undefined);

    renderConversionLog();

    fireEvent.click(screen.getByRole("button", { name: "Delete USD/EUR conversion" }));
    fireEvent.click(screen.getByRole("button", { name: "Clear all conversions" }));

    expect(deleteConversion).toHaveBeenCalledWith("conversion-usd-eur");
    expect(deleteAllConversions).toHaveBeenCalled();
  });

  it("shows the data unavailable error when deleting a conversion fails", async () => {
    deleteConversion.mockRejectedValue(new Error("Supabase failed"));

    renderConversionLog();

    fireEvent.click(screen.getByRole("button", { name: "Delete USD/EUR conversion" }));

    await waitFor(() => {
      expect(showDataUnavailableError).toHaveBeenCalled();
    });
  });

  it("renders the account conversion log empty state when no conversions exist", () => {
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

  it("renders the guest conversion log empty state when no conversions exist", () => {
    renderConversionLog({ conversions: [], isGuestMode: true });

    expect(screen.getByText(/Your log is private to this session and this browser/)).toBeTruthy();
  });

  it("formats relative timestamps for recent and older conversions", () => {
    const now = new Date("2026-07-01T22:58:21.000Z");

    expect(formatRelativeTime("2026-07-01T22:38:21.000Z", now)).toBe("20M");
    expect(formatRelativeTime("2026-07-01T21:58:21.000Z", now)).toBe("1H");
    expect(formatRelativeTime("2026-05-13T12:00:00.000Z", now)).toBe("13 May");
  });
});
