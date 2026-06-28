// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { RateDetails } from "./rate-details";

const { routerPush, testPathname } = vi.hoisted(() => ({
  routerPush: vi.fn(),
  testPathname: { current: "/" },
}));

vi.mock("next/navigation", () => ({
  usePathname: () => testPathname.current,
  useRouter: () => ({
    push: routerPush,
  }),
}));

afterEach(() => {
  testPathname.current = "/";
  routerPush.mockClear();
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
    render(
      <RateDetails>
        <section aria-label="Rate history" />
      </RateDetails>
    );

    fireEvent.click(screen.getByRole("button", { name: "Rate details sections: History" }));
    const compareLink = screen.getByRole("link", { name: "Compare" });

    expect(compareLink.getAttribute("href")).toBe("/rate/compare");
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
    expect(routerPush).not.toHaveBeenCalled();
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
});
