// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { RateHistory } from "./rate-history";

afterEach(() => {
  cleanup();
});

describe("RateHistory", () => {
  it("updates stats and chart details when a range tab is selected", () => {
    render(<RateHistory />);

    expect(screen.getByRole("tab", { name: "1M" }).getAttribute("aria-selected")).toBe("true");
    expect(screen.getAllByText("0.8549").length).toBeGreaterThan(0);
    expect(screen.getAllByText("0.8598").length).toBeGreaterThan(0);
    expect(screen.getByRole("img", { name: "Mock 1M USD to EUR rate history chart" })).toBeTruthy();

    fireEvent.click(screen.getByRole("tab", { name: "3M" }));

    expect(screen.getByRole("tab", { name: "3M" }).getAttribute("aria-selected")).toBe("true");
    expect(screen.getAllByText("0.8642").length).toBeGreaterThan(0);
    expect(screen.getAllByText("-0.0044").length).toBeGreaterThan(0);
    expect(screen.getAllByText("-0.51%").length).toBeGreaterThan(0);
    expect(screen.getByRole("img", { name: "Mock 3M USD to EUR rate history chart" })).toBeTruthy();
  });
});
