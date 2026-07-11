// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { act, type ComponentProps } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ConversionLog, formatRelativeTime, getConversionLogCsv } from "./conversion-log";

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

vi.mock("@/features/conversion-log/api/client", () => ({
  deleteAllConversions,
  deleteConversion,
}));

vi.mock("@/features/home/hooks/use-data-unavailable-error", () => ({
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
  vi.useRealTimers();
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
  return render(
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
    vi.useFakeTimers();
    deleteAllConversions.mockResolvedValue(undefined);
    deleteConversion.mockResolvedValue(undefined);

    renderConversionLog();

    const row = screen.getByRole("row", {
      name: "Load USD/EUR conversion, sent 1,000, received 853.02",
    });

    fireEvent.click(screen.getByRole("button", { name: "Delete USD/EUR conversion" }));

    expect(row.className).toContain("fx-list-row-out");

    act(() => {
      vi.advanceTimersByTime(160);
    });

    expect(
      screen.queryByRole("row", {
        name: "Load USD/EUR conversion, sent 1,000, received 853.02",
      })
    ).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Clear all conversions" }));

    expect(deleteConversion).toHaveBeenCalledWith("conversion-usd-eur");
    expect(deleteAllConversions).toHaveBeenCalled();
  });

  it("exports the conversion log as a CSV file", async () => {
    const createObjectURL = vi.fn<(blob: Blob) => string>(() => "blob:conversion-log");
    const revokeObjectURL = vi.fn<(url: string) => void>();

    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      value: createObjectURL,
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      value: revokeObjectURL,
    });

    renderConversionLog();

    const originalCreateElement = document.createElement.bind(document);
    const anchor = originalCreateElement("a");
    const click = vi.fn();

    anchor.click = click;

    const createElement = vi
      .spyOn(document, "createElement")
      .mockImplementation((tagName, options) => {
        if (tagName === "a") {
          return anchor;
        }

        return originalCreateElement(tagName, options);
      });

    fireEvent.click(screen.getByRole("button", { name: "Export conversions as CSV" }));

    const blob = createObjectURL.mock.calls[0][0];

    await expect(blob.text()).resolves.toBe(
      [
        "created_at,from_currency,to_currency,send_amount,receive_amount",
        "2026-07-01T22:38:21.000Z,USD,EUR,1000.00,853.02",
        "2026-07-01T22:24:21.000Z,EUR,JPY,500.00,92490",
      ].join("\n")
    );
    expect(anchor.download).toMatch(/^conversion-log-\d{4}-\d{2}-\d{2}\.csv$/);
    expect(anchor.href).toBe("blob:conversion-log");
    expect(click).toHaveBeenCalled();
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:conversion-log");

    createElement.mockRestore();
  });

  it("treats the conversion log actions as a roving focus toolbar", () => {
    renderConversionLog();

    const toolbar = screen.getByRole("toolbar", { name: "Conversion log actions" });
    const exportButton = screen.getByRole("button", { name: "Export conversions as CSV" });
    const clearButton = screen.getByRole("button", { name: "Clear all conversions" });

    expect(exportButton.tabIndex).toBe(0);
    expect(clearButton.tabIndex).toBe(-1);

    exportButton.focus();
    fireEvent.keyDown(toolbar, { key: "ArrowRight" });

    expect(document.activeElement).toBe(clearButton);
    expect(exportButton.tabIndex).toBe(-1);
    expect(clearButton.tabIndex).toBe(0);
  });

  it("shows the data unavailable error when deleting a conversion fails", async () => {
    deleteConversion.mockRejectedValue(new Error("Supabase failed"));

    renderConversionLog();

    fireEvent.click(screen.getByRole("button", { name: "Delete USD/EUR conversion" }));

    await waitFor(() => {
      expect(showDataUnavailableError).toHaveBeenCalled();
    });
  });

  it("animates into the empty state when the last conversion exits", () => {
    vi.useFakeTimers();
    deleteConversion.mockResolvedValue(undefined);

    renderConversionLog({ conversions: [conversions[0]] });

    fireEvent.click(screen.getByRole("button", { name: "Delete USD/EUR conversion" }));

    act(() => {
      vi.advanceTimersByTime(160);
    });

    expect(screen.getByText("No conversions logged yet").parentElement?.className).toContain(
      "fx-state-in"
    );
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

  it("animates the first conversion row when the log transitions from empty to populated", () => {
    vi.useFakeTimers();

    const { rerender } = renderConversionLog({ conversions: [] });

    expect(screen.getByText("No conversions logged yet").parentElement?.className).not.toContain(
      "fx-state-in"
    );

    rerender(
      <ConversionLog availableCurrencies={availableCurrencies} conversions={[conversions[0]]} />
    );

    const region = screen.getByRole("region", { name: "Conversion log" });
    const row = screen.getByRole("row", {
      name: "Load USD/EUR conversion, sent 1,000, received 853.02",
    });

    expect(region.className).toContain("fx-state-in");
    expect(row.className).toContain("fx-list-row-in");

    act(() => {
      vi.advanceTimersByTime(160);
    });

    expect(row.className).not.toContain("fx-list-row-in");
  });

  it("animates duplicate conversions as new rows", () => {
    vi.useFakeTimers();

    const duplicateConversion = {
      ...conversions[0],
      createdAt: "2026-07-01T22:59:21.000Z",
      id: "conversion-usd-eur-duplicate",
    };
    const { rerender } = renderConversionLog({ conversions: [conversions[0]] });

    rerender(
      <ConversionLog
        availableCurrencies={availableCurrencies}
        conversions={[duplicateConversion, conversions[0]]}
      />
    );

    const rows = screen.getAllByRole("row", {
      name: "Load USD/EUR conversion, sent 1,000, received 853.02",
    });

    expect(rows[0].className).toContain("fx-list-row-in");
    expect(rows[1].className).not.toContain("fx-list-row-in");
  });

  it("does not replay row entry when an optimistic conversion is replaced by the server row", () => {
    vi.useFakeTimers();

    const optimisticConversion = {
      ...conversions[0],
      id: "optimistic:conversion-usd-eur",
    };
    const { rerender } = renderConversionLog({ conversions: [optimisticConversion] });

    act(() => {
      vi.advanceTimersByTime(160);
    });

    rerender(
      <ConversionLog availableCurrencies={availableCurrencies} conversions={[conversions[0]]} />
    );

    const row = screen.getByRole("row", {
      name: "Load USD/EUR conversion, sent 1,000, received 853.02",
    });

    expect(row.className).not.toContain("fx-list-row-in");
  });

  it("continues row entry when an optimistic conversion is replaced before entry completes", () => {
    vi.useFakeTimers();

    const optimisticConversion = {
      ...conversions[0],
      id: "optimistic:conversion-usd-eur",
    };
    const { rerender } = renderConversionLog({ conversions: [] });

    rerender(
      <ConversionLog
        availableCurrencies={availableCurrencies}
        conversions={[optimisticConversion]}
      />
    );

    rerender(
      <ConversionLog availableCurrencies={availableCurrencies} conversions={[conversions[0]]} />
    );

    const row = screen.getByRole("row", {
      name: "Load USD/EUR conversion, sent 1,000, received 853.02",
    });

    expect(row.className).toContain("fx-list-row-in");

    act(() => {
      vi.advanceTimersByTime(160);
    });

    expect(row.className).not.toContain("fx-list-row-in");
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

  it("escapes CSV cells when conversion values contain CSV syntax", () => {
    expect(
      getConversionLogCsv([
        {
          createdAt: "2026-07-01T22:38:21.000Z",
          fromCurrency: 'U"S',
          id: "conversion-csv",
          receiveAmount: "853,02",
          sendAmount: "1000\n00",
          toCurrency: "EUR",
        },
      ])
    ).toBe(
      [
        "created_at,from_currency,to_currency,send_amount,receive_amount",
        '2026-07-01T22:38:21.000Z,"U""S",EUR,"1000\n00","853,02"',
      ].join("\n")
    );
  });
});
