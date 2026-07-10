// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { RateHistory } from "./rate-history";
import type { RateHistoryData } from "../rate-history";
import { deriveRateHistoryViewModel } from "../rate-history-chart-model";

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
  useRouter: () => ({ replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(""),
}));

const history: RateHistoryData = {
  pair: "USD/EUR",
  points: [
    { date: "2021-06-19", rate: 0.7 },
    { date: "2025-06-19", rate: 0.8 },
    { date: "2026-03-19", rate: 0.9 },
    { date: "2026-05-19", rate: 0.85 },
    { date: "2026-06-12", rate: 0.852 },
    { date: "2026-06-18", rate: 0.855 },
    { date: "2026-06-19", rate: 0.86 },
  ],
};

afterEach(() => {
  cleanup();
});

describe("RateHistory", () => {
  it("renders stats and chart details for the selected range", () => {
    render(
      <RateHistory model={deriveRateHistoryViewModel(history)} pair="USD/EUR" selectedRange="1M" />
    );

    expect(screen.getByRole("tab", { name: "1M" }).getAttribute("aria-selected")).toBe("true");
    expect(screen.getAllByText("0.8500").length).toBeGreaterThan(0);
    expect(screen.getAllByText("0.8600").length).toBeGreaterThan(0);
    expect(screen.getByRole("img", { name: "1M USD/EUR rate history chart" })).toBeTruthy();
    expect(screen.getByText("Open").closest("div")?.getAttribute("aria-live")).toBe("polite");
    expect(screen.getByRole("list", { name: "Chart details" }).getAttribute("aria-live")).toBe(
      "polite"
    );
    expect(
      document.querySelector("#rate-history-chart-summary-1m")?.getAttribute("aria-live")
    ).toBe("polite");

    expect(screen.getAllByRole("img", { name: /USD\/EUR rate history chart/ })).toHaveLength(1);

    fireEvent.click(screen.getByRole("tab", { name: "3M" }));
    expect(screen.getByRole("tab", { name: "3M" }).getAttribute("aria-selected")).toBe("true");
    expect(screen.getByRole("img", { name: "1M USD/EUR rate history chart" })).toBeTruthy();
  });

  it("keeps the chart area gradient pinned to the full chart height", () => {
    render(
      <RateHistory model={deriveRateHistoryViewModel(history)} pair="USD/EUR" selectedRange="1M" />
    );

    const gradient = document.querySelector("#rate-history-area-1m");

    expect(gradient?.getAttribute("gradientUnits")).toBe("userSpaceOnUse");
    expect(gradient?.getAttribute("y1")).toBe("0");
    expect(gradient?.getAttribute("y2")).toBe("272");
  });

  it("renders the tab empty state with the selected pair when history data is missing", () => {
    render(<RateHistory model={null} pair="USD/EUR" />);

    expect(screen.getByText("No chart data available")).toBeTruthy();
    expect(screen.getByText(/We couldn't load rate history for USD\/EUR right now\./)).toBeTruthy();
    expect(screen.queryByRole("region", { name: "Rate history" })).toBeNull();
    expect(screen.queryByRole("img", { name: /rate history chart/ })).toBeNull();
  });

  it("renders the tab empty state when history points are empty", () => {
    render(<RateHistory model={{ pair: "CAD/CHF", ranges: [] }} pair="USD/EUR" />);

    expect(screen.getByText("No chart data available")).toBeTruthy();
    expect(screen.getByText(/We couldn't load rate history for CAD\/CHF right now\./)).toBeTruthy();
    expect(screen.queryByRole("region", { name: "Rate history" })).toBeNull();
  });
});
