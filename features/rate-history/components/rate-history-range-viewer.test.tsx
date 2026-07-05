// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { RateHistoryRangeModel, RateHistoryViewModel } from "../rate-history";
import { RateHistoryRangeViewer } from "./rate-history-range-viewer";

const { testSearchParams } = vi.hoisted(() => ({
  testSearchParams: { current: "" },
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(testSearchParams.current),
}));

function createRange(range: RateHistoryRangeModel["range"], open: string): RateHistoryRangeModel {
  return {
    chart: {
      areaPath: "M0,272L267,0L267,272Z",
      firstDateLabel: "19 May",
      firstRate: open,
      lastDateLabel: "19 Jun",
      lastRate: "0.8600",
      linePath: "M0,272L267,0",
      xAxisLabels: [
        { label: "19 May", x: 0 },
        { label: "19 Jun", x: 267 },
      ],
      yAxisLabels: [
        { label: "0.9000", y: 0 },
        { label: "0.8750", y: 136 },
        { label: "0.8500", y: 272 },
      ],
    },
    range,
    stats: [
      { label: "Open", value: open },
      { label: "Last", value: "0.8600" },
      ...(range === "3M"
        ? [{ direction: "down" as const, label: "Change", showIndicator: false, value: "-0.0400" }]
        : []),
    ],
  };
}

const model: RateHistoryViewModel = {
  pair: "USD/EUR",
  ranges: [createRange("1M", "0.8500"), createRange("1Y", "0.7000"), createRange("3M", "0.9000")],
};

afterEach(() => {
  window.history.replaceState(null, "", "/");
  testSearchParams.current = "";
  cleanup();
});

describe("RateHistoryRangeViewer", () => {
  it("selects the clicked range locally without waiting on route data", () => {
    render(<RateHistoryRangeViewer model={model} selectedRange="1M" />);

    fireEvent.click(screen.getByRole("tab", { name: "3M" }));

    expect(screen.getByRole("tab", { name: "3M" }).getAttribute("aria-selected")).toBe("true");
    expect(screen.getByRole("tab", { name: "1M" }).getAttribute("aria-selected")).toBe("false");
    expect(screen.getByRole("img", { name: "3M USD/EUR rate history chart" })).toBeTruthy();
    expect(screen.queryByRole("img", { name: "1M USD/EUR rate history chart" })).toBeNull();
    expect(screen.getAllByText("0.9000").length).toBeGreaterThan(0);
    expect(window.location.search).toBe("?range=3M");
  });

  it("preserves existing URL state when selecting a new range", () => {
    testSearchParams.current = "from=GBP&to=JPY&range=1M";

    render(<RateHistoryRangeViewer model={model} selectedRange="1M" />);

    fireEvent.click(screen.getByRole("tab", { name: "1Y" }));

    expect(window.location.search).toBe("?from=GBP&to=JPY&range=1Y");
  });
});
