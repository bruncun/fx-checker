// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { RateDetails } from "./rate-details";
import { RateDetailsNavigation } from "./rate-details-navigation";

const { testPathname, testSearchParams } = vi.hoisted(() => ({
  testPathname: { current: "/" },
  testSearchParams: { current: "" },
}));
const { routerPush } = vi.hoisted(() => ({
  routerPush: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => testPathname.current,
  useRouter: () => ({
    push: routerPush,
  }),
  useSearchParams: () => new URLSearchParams(testSearchParams.current),
}));

afterEach(() => {
  testPathname.current = "/";
  testSearchParams.current = "";
  routerPush.mockReset();
  cleanup();
});

function renderRateDetails(children: ReactNode, favoritesCount = 0) {
  render(
    <RateDetails
      navigationSlot={<RateDetailsNavigation conversionCount={0} favoriteCount={favoritesCount} />}
    >
      {children}
    </RateDetails>
  );
}

describe("RateDetails", () => {
  it("owns rate section navigation and renders history as the default section", () => {
    renderRateDetails(<section aria-label="Rate history" />);

    expect(screen.getByRole("tablist", { name: "Sections" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Sections: History" })).toBeTruthy();
    expect(screen.getByRole("tabpanel", { name: "History" })).toBeTruthy();
    expect(screen.getByRole("region", { name: "Rate history" })).toBeTruthy();
  });

  it("links nested sections through route segments without scrolling the page", () => {
    testSearchParams.current = "from=GBP&to=USD";

    renderRateDetails(<section aria-label="Rate history" />, 3);

    fireEvent.click(screen.getByRole("button", { name: "Sections: History" }));
    const compareLink = screen.getByRole("link", { name: "Compare" });
    const historyLink = screen.getByRole("link", { name: "History" });

    expect(historyLink.getAttribute("href")).toBe("/app?from=GBP&to=USD");
    expect(compareLink.getAttribute("href")).toBe("/rate/compare?from=GBP&to=USD");
    expect(screen.getByRole("link", { name: "Favorites, 3" })).toBeTruthy();
  });

  it("moves focus through the mobile menu without activating a route", () => {
    renderRateDetails(<section aria-label="Rate history" />);

    fireEvent.click(screen.getByRole("button", { name: "Sections: History" }));
    const historyLink = screen.getByRole("link", { name: "History" });

    historyLink.focus();
    fireEvent.keyDown(historyLink, { key: "ArrowDown" });

    expect(document.activeElement).toBe(screen.getByRole("link", { name: "Compare" }));
  });

  it("renders the selected nested section from the route", () => {
    testPathname.current = "/rate/compare";

    renderRateDetails(<section aria-label="Compare" />);

    expect(screen.getByRole("button", { name: "Sections: Compare" })).toBeTruthy();
    expect(screen.queryByRole("region", { name: "Rate history" })).toBeNull();
    expect(screen.getByRole("region", { name: "Compare" })).toBeTruthy();
  });

  it("renders desktop section tabs as route links", () => {
    testPathname.current = "/rate/compare";
    testSearchParams.current = "from=GBP&to=USD";

    renderRateDetails(<section aria-label="Compare" />, 4);

    const historyTab = screen.getByRole("tab", { name: "History" });
    const compareTab = screen.getByRole("tab", { name: "Compare" });
    const favoritesTab = screen.getByRole("tab", { name: "Favorites, 4" });
    const tabPanel = screen.getByRole("tabpanel", { name: "Compare" });

    expect(historyTab.getAttribute("href")).toBe("/app?from=GBP&to=USD");
    expect(compareTab.getAttribute("href")).toBe("/rate/compare?from=GBP&to=USD");
    expect(favoritesTab.getAttribute("href")).toBe("/rate/favorites?from=GBP&to=USD");
    expect(compareTab.getAttribute("id")).toBe("rate-details-compare-tab");
    expect(compareTab.getAttribute("aria-controls")).toBe("rate-details-compare-panel");
    expect(tabPanel.getAttribute("id")).toBe("rate-details-compare-panel");
    expect(tabPanel.getAttribute("aria-labelledby")).toBe("rate-details-compare-tab");
  });

  it("pushes the route when a desktop section tab receives focus", () => {
    testSearchParams.current = "from=GBP&to=USD";

    renderRateDetails(<section aria-label="Rate history" />);

    screen.getByRole("tab", { name: "Compare" }).focus();

    expect(routerPush).toHaveBeenCalledWith("/rate/compare?from=GBP&to=USD", { scroll: false });
    expect(routerPush).toHaveBeenCalledTimes(1);
  });
});
