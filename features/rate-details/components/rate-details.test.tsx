// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

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

describe("RateDetails", () => {
  it("owns rate section navigation and renders history as the default section", () => {
    render(
      <RateDetails>
        <section aria-label="Rate history" />
      </RateDetails>
    );

    expect(screen.getByRole("navigation", { name: "Rate details sections" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Rate details sections: History" })).toBeTruthy();
    expect(screen.getByRole("region", { name: "Rate history" })).toBeTruthy();
  });

  it("links nested sections through route segments without scrolling the page", () => {
    testSearchParams.current = "from=GBP&to=USD";

    render(
      <RateDetails>
        <section aria-label="Rate history" />
      </RateDetails>
    );

    fireEvent.click(screen.getByRole("button", { name: "Rate details sections: History" }));
    const compareLink = screen.getByRole("link", { name: "Compare" });

    expect(compareLink.getAttribute("href")).toBe("/rate/compare?from=GBP&to=USD");
  });

  it("moves focus through the mobile menu without activating a route", () => {
    render(
      <RateDetails>
        <section aria-label="Rate history" />
      </RateDetails>
    );

    fireEvent.click(screen.getByRole("button", { name: "Rate details sections: History" }));
    const historyLink = screen.getByRole("link", { name: "History" });

    historyLink.focus();
    fireEvent.keyDown(historyLink, { key: "ArrowDown" });

    expect(document.activeElement).toBe(screen.getByRole("link", { name: "Compare" }));
  });

  it("renders the selected nested section from the route", () => {
    testPathname.current = "/rate/compare";

    render(
      <RateDetails>
        <section aria-label="Compare" />
      </RateDetails>
    );

    expect(screen.getByRole("button", { name: "Rate details sections: Compare" })).toBeTruthy();
    expect(screen.queryByRole("region", { name: "Rate history" })).toBeNull();
    expect(screen.getByRole("region", { name: "Compare" })).toBeTruthy();
  });

  it("renders desktop section tabs as route links", () => {
    testPathname.current = "/rate/compare";
    testSearchParams.current = "from=GBP&to=USD";

    render(
      <RateDetails>
        <section aria-label="Compare" />
      </RateDetails>
    );

    const historyTab = screen.getByRole("tab", { name: "History" });
    const compareTab = screen.getByRole("tab", { name: "Compare" });

    expect(historyTab.getAttribute("href")).toBe("/?from=GBP&to=USD");
    expect(compareTab.getAttribute("href")).toBe("/rate/compare?from=GBP&to=USD");
  });
});
