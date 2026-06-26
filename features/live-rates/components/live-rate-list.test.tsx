// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { mockLiveRates } from "../mock-live-rates";
import { LiveRateList } from "./live-rate-list";

afterEach(() => {
  cleanup();
});

describe("LiveRateList", () => {
  it("renders the live-markets badge beside the scrollable rate list", () => {
    render(<LiveRateList rates={mockLiveRates} />);

    const badge = screen.getByText("Live markets").parentElement;
    const scroller = screen.getByRole("region", { name: "Live exchange rates" });

    expect(badge?.nextElementSibling).toBe(scroller);
    expect(badge?.classList.contains("shrink-0")).toBe(true);
    expect(badge?.classList.contains("bg-lime-500")).toBe(true);
    expect(badge?.querySelector('[aria-hidden="true"]')).not.toBeNull();
  });

  it("renders every mock rate in order", () => {
    render(<LiveRateList rates={mockLiveRates} />);

    const list = screen.getByRole("list", { name: "Live exchange rates" });
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

  it("keeps the scroll region out of the tab order", () => {
    render(<LiveRateList rates={mockLiveRates} />);

    const scroller = screen.getByRole("region", { name: "Live exchange rates" });

    expect(scroller.getAttribute("tabindex")).toBeNull();
  });

  it("groups the rate actions in a labelled toolbar", () => {
    render(<LiveRateList rates={mockLiveRates} />);

    const toolbar = screen.getByRole("toolbar", { name: "Live markets" });

    expect(within(toolbar).getAllByRole("button")).toHaveLength(7);
  });

  it("keeps one rate action in the tab sequence", () => {
    render(<LiveRateList rates={mockLiveRates} />);

    const eurUsdButton = screen.getByRole("button", {
      name: "Use EUR/USD in converter, rate 1.1723, down -0.14%",
    });
    const usdJpyButton = screen.getByRole("button", {
      name: "Use USD/JPY in converter, rate 157.91, up +0.04%",
    });

    expect(eurUsdButton.tabIndex).toBe(0);
    expect(usdJpyButton.tabIndex).toBe(-1);
  });

  it("moves focus through the toolbar with horizontal arrow keys", () => {
    const onRateSelect = vi.fn();
    render(<LiveRateList rates={mockLiveRates} onRateSelect={onRateSelect} />);

    const eurUsdButton = screen.getByRole("button", {
      name: "Use EUR/USD in converter, rate 1.1723, down -0.14%",
    });
    const usdJpyButton = screen.getByRole("button", {
      name: "Use USD/JPY in converter, rate 157.91, up +0.04%",
    });

    eurUsdButton.focus();
    fireEvent.keyDown(eurUsdButton, { key: "ArrowRight" });

    expect(document.activeElement).toBe(usdJpyButton);
    expect(eurUsdButton.tabIndex).toBe(-1);
    expect(usdJpyButton.tabIndex).toBe(0);
    expect(onRateSelect).not.toHaveBeenCalled();
  });

  it("wraps toolbar arrow-key navigation at both ends", () => {
    render(<LiveRateList rates={mockLiveRates} />);

    const firstButton = screen.getByRole("button", {
      name: "Use EUR/USD in converter, rate 1.1723, down -0.14%",
    });
    const lastButton = screen.getByRole("button", {
      name: "Use USD/CAD in converter, rate 1.3815, up +0.04%",
    });

    firstButton.focus();
    fireEvent.keyDown(firstButton, { key: "ArrowLeft" });
    expect(document.activeElement).toBe(lastButton);

    fireEvent.keyDown(lastButton, { key: "ArrowRight" });
    expect(document.activeElement).toBe(firstButton);
  });

  it("moves to the first and last toolbar actions with Home and End", () => {
    render(<LiveRateList rates={mockLiveRates} />);

    const firstButton = screen.getByRole("button", {
      name: "Use EUR/USD in converter, rate 1.1723, down -0.14%",
    });
    const middleButton = screen.getByRole("button", {
      name: "Use GBP/USD in converter, rate 1.3575, down -0.22%",
    });
    const lastButton = screen.getByRole("button", {
      name: "Use USD/CAD in converter, rate 1.3815, up +0.04%",
    });

    middleButton.focus();
    fireEvent.keyDown(middleButton, { key: "End" });
    expect(document.activeElement).toBe(lastButton);

    fireEvent.keyDown(lastButton, { key: "Home" });
    expect(document.activeElement).toBe(firstButton);
  });

  it("emits the selected rate item", () => {
    const onRateSelect = vi.fn();
    render(<LiveRateList rates={mockLiveRates} onRateSelect={onRateSelect} />);

    const eurUsdButton = screen.getByRole("button", {
      name: "Use EUR/USD in converter, rate 1.1723, down -0.14%",
    });

    expect(screen.getAllByRole("button")).toHaveLength(7);

    fireEvent.click(eurUsdButton);

    expect(onRateSelect).toHaveBeenCalledWith(mockLiveRates[0]);
  });

  it("does not expose a selected state for ticker items", () => {
    render(<LiveRateList rates={mockLiveRates} />);

    const eurUsdButton = screen.getByRole("button", {
      name: "Use EUR/USD in converter, rate 1.1723, down -0.14%",
    });

    expect(eurUsdButton.getAttribute("aria-pressed")).toBeNull();
  });

  it("copies the lime focus style to each rate item", () => {
    render(<LiveRateList rates={mockLiveRates} />);

    const button = screen.getByRole("button", {
      name: "Use EUR/USD in converter, rate 1.1723, down -0.14%",
    });

    expect(button.classList.contains("focus-visible:after:border-lime-500")).toBe(true);
  });

  it("uses the direction to style positive and negative changes", () => {
    render(<LiveRateList rates={mockLiveRates.slice(0, 2)} />);

    const list = screen.getByRole("list", { name: "Live exchange rates" });

    expect(within(list).getByText("-0.14%").parentElement?.classList.contains("text-red-500")).toBe(
      true
    );
    expect(
      within(list).getByText("+0.04%").parentElement?.classList.contains("text-green-500")
    ).toBe(true);
  });
});
