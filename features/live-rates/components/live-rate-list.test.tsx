// @vitest-environment jsdom

import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { mockLiveRates } from "../testing/mock-live-rates";
import { LiveRateList } from "./live-rate-list";

afterEach(() => {
  cleanup();
});

describe("LiveRateList", () => {
  it("renders the live-markets badge beside the scrollable rate list", () => {
    render(<LiveRateList rates={mockLiveRates} />);

    const badge = screen.getByText("Live markets").parentElement;
    const scroller = screen.getByRole("region", { name: "Live exchange rates" });

    expect(screen.getByRole("complementary", { name: "Live markets" })).toBeTruthy();
    expect(badge?.nextElementSibling).toBe(scroller);
    expect(badge?.classList.contains("shrink-0")).toBe(true);
    expect(badge?.classList.contains("bg-lime-500")).toBe(true);
    expect(badge?.querySelector('[aria-hidden="true"]')).not.toBeNull();
  });

  it("renders every mock rate in order", () => {
    render(<LiveRateList rates={mockLiveRates} />);

    const scroller = screen.getByRole("region", { name: "Live exchange rates" });
    const list = within(scroller).getByRole("list");
    const items = within(list).getAllByRole("listitem");

    expect(items).toHaveLength(7);
    expect(items[0]?.textContent).toBe("EUR/USD1.1723▼\u00a0-0.14%");
    expect(items[6]?.textContent).toBe("USD/CAD1.3815▲\u00a0+0.04%");
  });

  it("renders a single static rate group", () => {
    const { container } = render(<LiveRateList rates={mockLiveRates} />);

    expect(container.querySelectorAll("li")).toHaveLength(7);
    expect(screen.getAllByRole("list")).toHaveLength(1);
    expect(container.querySelector('ul[aria-hidden="true"]')).toBeNull();
  });

  it("keeps the scroll region keyboard focusable", () => {
    render(<LiveRateList rates={mockLiveRates} />);

    const scroller = screen.getByRole("region", { name: "Live exchange rates" });

    expect(scroller.getAttribute("tabindex")).toBe("0");
    expect(scroller.hasAttribute("data-live-rates-scroll-region")).toBe(true);
    expect(scroller.className).toContain("focus-visible:[&>ul]:after:shadow-");
    expect(scroller.className).toContain("focus-visible:[&>ul]:after:z-10");
    expect(scroller.className).not.toContain("focus-visible:after:");
  });

  it("renders rate items as static content", () => {
    render(<LiveRateList rates={mockLiveRates} />);

    const scroller = screen.getByRole("region", { name: "Live exchange rates" });
    const list = within(scroller).getByRole("list");

    expect(within(list).getAllByRole("listitem")).toHaveLength(7);
    expect(within(list).queryAllByRole("button")).toHaveLength(0);
    expect(screen.queryByRole("toolbar")).toBeNull();
  });

  it("does not expose ticker items as focusable actions", () => {
    render(<LiveRateList rates={mockLiveRates} />);

    const scroller = screen.getByRole("region", { name: "Live exchange rates" });
    const list = within(scroller).getByRole("list");
    const firstItem = within(list).getAllByRole("listitem")[0];

    expect(firstItem?.getAttribute("tabindex")).toBeNull();
    expect(firstItem?.classList.contains("hover:bg-neutral-600")).toBe(false);
    expect(firstItem?.classList.contains("focus-visible:after:border-lime-500")).toBe(false);
  });

  it("uses the direction to style positive and negative changes", () => {
    render(<LiveRateList rates={mockLiveRates.slice(0, 2)} />);

    const scroller = screen.getByRole("region", { name: "Live exchange rates" });
    const list = within(scroller).getByRole("list");

    expect(within(list).getByText("-0.14%").parentElement?.classList.contains("text-red-500")).toBe(
      true
    );
    expect(
      within(list).getByText("+0.04%").parentElement?.classList.contains("text-green-500")
    ).toBe(true);
  });
});
