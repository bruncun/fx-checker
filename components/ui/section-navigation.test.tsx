// @vitest-environment jsdom

import * as React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { SectionNavigation, type SectionNavigationItem } from "./section-navigation";

const sections: SectionNavigationItem[] = [
  { href: "#history", label: "History", value: "history" },
  { href: "#compare", label: "Compare", value: "compare" },
  { count: 10, href: "#favorites", label: "Favorites", value: "favorites" },
  { count: 8, href: "#log", label: "Log", value: "log" },
];

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("SectionNavigation", () => {
  it("opens the mobile navigation menu from the trigger", () => {
    render(
      <SectionNavigation aria-label="Rate details sections" items={sections} value="history" />
    );

    const trigger = screen.getByRole("button", { name: "Rate details sections: History" });
    fireEvent.click(trigger);

    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    expect(document.getElementById(trigger.getAttribute("aria-controls") ?? "")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Favorites, 10" }).getAttribute("href")).toBe(
      "#favorites"
    );
  });

  it("marks the current section link with aria-current", () => {
    render(
      <SectionNavigation aria-label="Rate details sections" items={sections} value="favorites" />
    );

    fireEvent.click(screen.getByRole("button", { name: "Rate details sections: Favorites, 10" }));

    expect(screen.getByRole("link", { name: "Favorites, 10" }).getAttribute("aria-current")).toBe(
      "page"
    );
    expect(screen.getByRole("link", { name: "History" }).hasAttribute("aria-current")).toBe(false);
  });

  it("opens the mobile menu without scrolling the window", () => {
    const scrollTo = vi.fn();

    vi.stubGlobal("scrollTo", scrollTo);

    render(
      <SectionNavigation aria-label="Rate details sections" items={sections} value="history" />
    );

    const trigger = screen.getByRole("button", { name: "Rate details sections: History" });

    vi.spyOn(trigger, "getBoundingClientRect").mockReturnValue({
      bottom: 280,
      height: 40,
      left: 0,
      right: 320,
      top: 240,
      width: 320,
      x: 0,
      y: 240,
      toJSON: () => ({}),
    });

    fireEvent.click(trigger);

    expect(scrollTo).not.toHaveBeenCalled();
    expect(screen.getByRole("link", { name: "Compare" })).toBeTruthy();
  });

  it("flips the open mobile menu above the trigger when scrolling would push it below the viewport", () => {
    const triggerRect = {
      bottom: 140,
      height: 40,
      left: 0,
      right: 320,
      top: 100,
      width: 320,
      x: 0,
      y: 100,
      toJSON: () => ({}),
    };

    render(
      <SectionNavigation aria-label="Rate details sections" items={sections} value="history" />
    );

    const trigger = screen.getByRole("button", { name: "Rate details sections: History" });

    vi.spyOn(trigger, "getBoundingClientRect").mockImplementation(() => triggerRect);

    fireEvent.click(trigger);
    const panel = document.getElementById(trigger.getAttribute("aria-controls") ?? "");

    expect(panel?.className).toContain("top-[calc(100%+8px)]");

    triggerRect.top = 700;
    triggerRect.bottom = 740;
    fireEvent.scroll(window);

    expect(panel?.className).toContain("bottom-[calc(100%+8px)]");
    expect(panel?.className).toContain("fx-panel-flip-top");
  });

  it("flips the open mobile menu below the trigger when scrolling creates more room below", () => {
    const triggerRect = {
      bottom: 740,
      height: 40,
      left: 0,
      right: 320,
      top: 700,
      width: 320,
      x: 0,
      y: 700,
      toJSON: () => ({}),
    };

    render(
      <SectionNavigation aria-label="Rate details sections" items={sections} value="history" />
    );

    const trigger = screen.getByRole("button", { name: "Rate details sections: History" });

    vi.spyOn(trigger, "getBoundingClientRect").mockImplementation(() => triggerRect);

    fireEvent.click(trigger);
    const panel = document.getElementById(trigger.getAttribute("aria-controls") ?? "");

    expect(panel?.className).toContain("bottom-[calc(100%+8px)]");

    triggerRect.top = 100;
    triggerRect.bottom = 140;
    fireEvent.scroll(window);

    expect(panel?.className).toContain("top-[calc(100%+8px)]");
    expect(panel?.className).toContain("fx-panel-flip-bottom");
  });

  it("uses inset neutral-200 shadows instead of hover or focus fills for menu links", () => {
    render(
      <SectionNavigation aria-label="Rate details sections" items={sections} value="history" />
    );

    fireEvent.click(screen.getByRole("button", { name: "Rate details sections: History" }));
    const link = screen.getByRole("link", { name: "Compare" });

    expect(link.className).not.toContain("hover:bg-");
    expect(link.className).not.toContain("focus:bg-");
    expect(link.className).toContain("hover:shadow-[inset_0_0_0_1px_hsl(var(--neutral-200))]");
    expect(link.className).toContain("focus:shadow-[inset_0_0_0_1px_hsl(var(--");
    expect(link.className).toContain("active:shadow-[inset_0_0_0_1px_hsl(var(--neutral-200))]");
  });

  it("keeps menu rows at 40px and section count badges circular", () => {
    render(
      <SectionNavigation aria-label="Rate details sections" items={sections} value="history" />
    );

    fireEvent.click(screen.getByRole("button", { name: "Rate details sections: History" }));
    const favoritesLink = screen.getByRole("link", { name: "Favorites, 10" });
    const badge = favoritesLink.querySelector("span:last-child");

    expect(favoritesLink.className).toContain("h-500");
    expect(favoritesLink.className).toContain("py-125");
    expect(favoritesLink.className).toContain("px-100");
    expect(badge?.className).toContain("rounded-full");
    expect(badge?.className).toContain("shrink-0");
    expect(badge?.className).toContain("items-center");
    expect(badge?.className).toContain("justify-center");
  });

  it("renders the tablet navigation as a WCAG tablist", () => {
    render(
      <SectionNavigation aria-label="Rate details sections" items={sections} value="favorites" />
    );

    const tablist = screen.getByRole("tablist", { name: "Rate details sections" });
    const favoritesTab = screen.getByRole("tab", { name: "Favorites, 10" });
    const historyTab = screen.getByRole("tab", { name: "History" });

    expect(tablist.className).toContain("sm:flex");
    expect(tablist.className).toContain("shadow-[inset_0_-1px_0_0_hsl(var(--neutral-600))]");
    expect(favoritesTab.getAttribute("aria-selected")).toBe("true");
    expect(favoritesTab.getAttribute("tabindex")).toBe("0");
    expect(historyTab.getAttribute("aria-selected")).toBe("false");
    expect(historyTab.getAttribute("tabindex")).toBe("-1");
  });

  it("links tablet tabs to their panels when ids are provided", () => {
    render(
      <SectionNavigation
        aria-label="Rate details sections"
        items={sections.map((section) => ({
          ...section,
          panelId: `${section.value}-panel`,
          tabId: `${section.value}-tab`,
        }))}
        value="favorites"
      />
    );

    const favoritesTab = screen.getByRole("tab", { name: "Favorites, 10" });

    expect(favoritesTab.getAttribute("id")).toBe("favorites-tab");
    expect(favoritesTab.getAttribute("aria-controls")).toBe("favorites-panel");
  });

  it("moves focus through tablet tabs without programmatic navigation", () => {
    render(
      <SectionNavigation aria-label="Rate details sections" items={sections} value="history" />
    );

    const historyTab = screen.getByRole("tab", { name: "History" });

    historyTab.focus();
    fireEvent.keyDown(historyTab, { key: "ArrowRight" });

    expect(document.activeElement).toBe(screen.getByRole("tab", { name: "Compare" }));
    expect(screen.getByRole("tab", { name: "Compare" }).getAttribute("href")).toBe("#compare");
  });

  it("activates a tablet tab when it receives keyboard focus", () => {
    const onTabActivate = vi.fn();

    render(
      <SectionNavigation
        aria-label="Rate details sections"
        items={sections}
        onTabActivate={onTabActivate}
        value="history"
      />
    );

    screen.getByRole("tab", { name: "Compare" }).focus();

    expect(onTabActivate).toHaveBeenCalledWith(sections[1]);
    expect(onTabActivate).toHaveBeenCalledTimes(1);
  });

  it("does not activate a tablet tab when pointer focus precedes link activation", () => {
    const onTabActivate = vi.fn();

    render(
      <SectionNavigation
        aria-label="Rate details sections"
        items={sections}
        onTabActivate={onTabActivate}
        value="history"
      />
    );

    const compareTab = screen.getByRole("tab", { name: "Compare" });

    fireEvent.pointerDown(compareTab);
    compareTab.focus();

    expect(onTabActivate).not.toHaveBeenCalled();
  });

  it("activates the next tablet tab when focus moves with arrow keys", () => {
    const onTabActivate = vi.fn();

    render(
      <SectionNavigation
        aria-label="Rate details sections"
        items={sections}
        onTabActivate={onTabActivate}
        value="history"
      />
    );

    const historyTab = screen.getByRole("tab", { name: "History" });

    historyTab.focus();
    fireEvent.keyDown(historyTab, { key: "ArrowRight" });

    expect(onTabActivate).toHaveBeenCalledWith(sections[1]);
    expect(onTabActivate).toHaveBeenCalledTimes(1);
  });

  it("closes the menu when a section link is clicked", () => {
    render(
      <SectionNavigation aria-label="Rate details sections" items={sections} value="history" />
    );

    fireEvent.click(screen.getByRole("button", { name: "Rate details sections: History" }));

    fireEvent.click(screen.getByRole("link", { name: "Compare" }));

    expect(screen.queryByRole("link", { name: "Compare" })).toBeNull();
  });

  it("moves through links without navigating until the user commits by default", () => {
    render(
      <SectionNavigation aria-label="Rate details sections" items={sections} value="history" />
    );

    fireEvent.click(screen.getByRole("button", { name: "Rate details sections: History" }));
    const historyLink = screen.getByRole("link", { name: "History" });

    historyLink.focus();
    fireEvent.keyDown(historyLink, { key: "ArrowDown" });

    expect(document.activeElement).toBe(screen.getByRole("link", { name: "Compare" }));

    fireEvent.click(screen.getByRole("link", { name: "Compare" }));

    expect(screen.queryByRole("link", { name: "Compare" })).toBeNull();
  });

  it("closes the dropdown when tabbing out of the links", () => {
    render(
      <SectionNavigation aria-label="Rate details sections" items={sections} value="history" />
    );

    fireEvent.click(screen.getByRole("button", { name: "Rate details sections: History" }));
    const historyLink = screen.getByRole("link", { name: "History" });

    historyLink.focus();
    fireEvent.keyDown(historyLink, { key: "Tab" });

    expect(screen.queryByRole("link", { name: "History" })).toBeNull();
  });
});
