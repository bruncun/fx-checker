// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { RateHistory } from "./rate-history";
import type { RateHistoryData } from "../rate-history";

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
  it("updates stats and chart details when a range tab is selected", () => {
    render(<RateHistory history={history} />);

    expect(screen.getByRole("tab", { name: "1M" }).getAttribute("aria-selected")).toBe("true");
    expect(screen.getAllByText("0.8500").length).toBeGreaterThan(0);
    expect(screen.getAllByText("0.8600").length).toBeGreaterThan(0);
    expect(screen.getByRole("img", { name: "1M USD/EUR rate history chart" })).toBeTruthy();
    expect(screen.getByText("Open").closest("div")?.getAttribute("aria-live")).toBe("polite");
    expect(screen.getByRole("list", { name: "Chart details" }).getAttribute("aria-live")).toBe(
      "polite"
    );
    expect(document.querySelector("#rate-history-chart-summary")?.getAttribute("aria-live")).toBe(
      "polite"
    );

    fireEvent.click(screen.getByRole("tab", { name: "3M" }));

    expect(screen.getByRole("tab", { name: "3M" }).getAttribute("aria-selected")).toBe("true");
    expect(screen.getAllByText("0.9000").length).toBeGreaterThan(0);
    expect(screen.getAllByText("-0.0400").length).toBeGreaterThan(0);
    expect(screen.getAllByText("-4.44%").length).toBeGreaterThan(0);
    expect(screen.getByRole("img", { name: "3M USD/EUR rate history chart" })).toBeTruthy();
  });
});
