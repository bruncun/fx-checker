// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { RateHistory } from "./rate-history";
import type { RateHistoryData } from "../rate-history";
import { deriveRateHistoryViewModel } from "../rate-history-chart-model";

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
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

    expect(
      screen.getAllByRole("img", { name: /USD\/EUR rate history chart/, hidden: true })
    ).toHaveLength(6);

    fireEvent.click(screen.getByRole("tab", { name: "3M" }));
    expect(screen.getByRole("tab", { name: "3M" }).getAttribute("aria-selected")).toBe("true");
    expect(screen.getAllByText("0.9000").length).toBeGreaterThan(0);
    expect(screen.getAllByText("-0.0400").length).toBeGreaterThan(0);
    expect(screen.getAllByText("-4.44%").length).toBeGreaterThan(0);
    expect(screen.getByRole("img", { name: "3M USD/EUR rate history chart" })).toBeTruthy();
  });

  it("shows the closest chart point details while hovering the rate chart", () => {
    render(
      <RateHistory model={deriveRateHistoryViewModel(history)} pair="USD/EUR" selectedRange="1M" />
    );

    const chartRegion = screen.getByRole("img", { name: "1M USD/EUR rate history chart" });
    const chartSurface = chartRegion.querySelector(".cursor-crosshair") as HTMLElement;

    chartSurface.getBoundingClientRect = vi.fn(() => ({
      bottom: 272,
      height: 272,
      left: 0,
      right: 267,
      toJSON: vi.fn(),
      top: 0,
      width: 267,
      x: 0,
      y: 0,
    }));

    fireEvent.pointerMove(chartSurface, { clientX: 267 });

    expect(screen.getAllByText("Jun 19, 2026 16:00 CET")).toHaveLength(1);
    expect(screen.getAllByText("0.8600").length).toBeGreaterThan(0);

    fireEvent.pointerLeave(chartSurface);

    expect(screen.queryByText("Jun 19, 2026 16:00 CET")).toBeNull();
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
