// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { RateHistoryRangeViewer, type RateHistoryRangePanel } from "./rate-history-range-viewer";

const { testSearchParams } = vi.hoisted(() => ({
  testSearchParams: { current: "" },
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(testSearchParams.current),
}));

const panels: RateHistoryRangePanel[] = [
  {
    chart: <section aria-label="1M chart">One month chart</section>,
    range: "1M",
    stats: [
      { label: "Open", value: "0.8500" },
      { label: "Last", value: "0.8600" },
    ],
  },
  {
    chart: <section aria-label="1Y chart">One year chart</section>,
    range: "1Y",
    stats: [
      { label: "Open", value: "0.7000" },
      { label: "Last", value: "0.8600" },
    ],
  },
  {
    chart: <section aria-label="3M chart">Three month chart</section>,
    range: "3M",
    stats: [
      { label: "Open", value: "0.9000" },
      { label: "Last", value: "0.8600" },
      { direction: "down", label: "Change", showIndicator: false, value: "-0.0400" },
    ],
  },
];

afterEach(() => {
  window.history.replaceState(null, "", "/");
  testSearchParams.current = "";
  cleanup();
});

describe("RateHistoryRangeViewer", () => {
  it("selects the clicked range locally without waiting on route data", () => {
    render(<RateHistoryRangeViewer panels={panels} selectedRange="1M" />);

    fireEvent.click(screen.getByRole("tab", { name: "3M" }));

    expect(screen.getByRole("tab", { name: "3M" }).getAttribute("aria-selected")).toBe("true");
    expect(screen.getByRole("tab", { name: "1M" }).getAttribute("aria-selected")).toBe("false");
    expect(screen.getByRole("region", { name: "3M chart" })).toBeTruthy();
    expect(screen.queryByRole("region", { name: "1M chart" })).toBeNull();
    expect(screen.getByText("0.9000")).toBeTruthy();
    expect(window.location.search).toBe("?range=3M");
  });

  it("preserves existing URL state when selecting a new range", () => {
    testSearchParams.current = "from=GBP&to=JPY&range=1M";

    render(<RateHistoryRangeViewer panels={panels} selectedRange="1M" />);

    fireEvent.click(screen.getByRole("tab", { name: "1Y" }));

    expect(window.location.search).toBe("?from=GBP&to=JPY&range=1Y");
  });
});
