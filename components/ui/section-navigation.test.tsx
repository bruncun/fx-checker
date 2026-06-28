// @vitest-environment jsdom

import * as React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { SectionNavigation, type SectionNavigationItem } from "./section-navigation";

const { routerPush } = vi.hoisted(() => ({
  routerPush: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: routerPush,
  }),
}));

const sections: SectionNavigationItem[] = [
  { href: "#history", label: "History", value: "history" },
  { href: "#compare", label: "Compare", value: "compare" },
  { count: 10, href: "#favorites", label: "Favorites", value: "favorites" },
  { count: 8, href: "#log", label: "Log", value: "log" },
];

afterEach(() => {
  routerPush.mockClear();
  cleanup();
});

describe("SectionNavigation", () => {
  function StatefulSectionNavigation() {
    const [selectedSection, setSelectedSection] = React.useState("history");

    return (
      <SectionNavigation
        aria-label="Rate details sections"
        items={sections}
        onNavigate={(section) => {
          setSelectedSection(section.value);
        }}
        value={selectedSection}
      />
    );
  }

  it("opens the mobile navigation menu from the trigger", () => {
    render(
      <SectionNavigation aria-label="Rate details sections" items={sections} value="history" />
    );

    const trigger = screen.getByRole("button", { name: "Rate details sections: History" });
    fireEvent.click(trigger);

    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    expect(screen.getByRole("navigation", { name: "Rate details sections" })).toBeTruthy();
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

  it("supports stateful prototype navigation through the trigger", () => {
    render(<StatefulSectionNavigation />);

    fireEvent.click(screen.getByRole("button", { name: "Rate details sections: History" }));
    fireEvent.click(screen.getByRole("link", { name: "Favorites, 10" }));

    expect(
      screen.getByRole("button", { name: "Rate details sections: Favorites, 10" })
    ).toBeTruthy();
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

  it("activates tablet tabs when focus moves between them", () => {
    const onNavigate = vi.fn();

    render(
      <SectionNavigation
        aria-label="Rate details sections"
        items={sections}
        onNavigate={onNavigate}
        value="history"
      />
    );

    const historyTab = screen.getByRole("tab", { name: "History" });

    historyTab.focus();
    fireEvent.keyDown(historyTab, { key: "ArrowRight" });

    expect(onNavigate).toHaveBeenCalledWith({
      href: "#compare",
      label: "Compare",
      value: "compare",
    });
    expect(document.activeElement).toBe(screen.getByRole("tab", { name: "Compare" }));
  });

  it("emits navigation, closes the menu, and restores trigger focus", () => {
    const onNavigate = vi.fn();

    render(
      <SectionNavigation
        aria-label="Rate details sections"
        items={sections}
        onNavigate={onNavigate}
        value="history"
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Rate details sections: History" }));
    expect(onNavigate).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("link", { name: "Compare" }));

    expect(onNavigate).toHaveBeenCalledWith({
      href: "#compare",
      label: "Compare",
      value: "compare",
    });
    expect(screen.queryByRole("link", { name: "Compare" })).toBeNull();
  });

  it("moves through links without navigating until the user commits by default", () => {
    const onNavigate = vi.fn();

    render(
      <SectionNavigation
        aria-label="Rate details sections"
        items={sections}
        onNavigate={onNavigate}
        value="history"
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Rate details sections: History" }));
    const historyLink = screen.getByRole("link", { name: "History" });

    historyLink.focus();
    fireEvent.keyDown(historyLink, { key: "ArrowDown" });

    expect(onNavigate).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(screen.getByRole("link", { name: "Compare" }));

    fireEvent.click(screen.getByRole("link", { name: "Compare" }));

    expect(onNavigate).toHaveBeenCalledWith({
      href: "#compare",
      label: "Compare",
      value: "compare",
    });
  });

  it("activates the focused link when automatic focus activation is enabled", () => {
    const onNavigate = vi.fn();

    render(
      <SectionNavigation
        activateOnFocus
        aria-label="Rate details sections"
        items={sections}
        onNavigate={onNavigate}
        value="history"
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Rate details sections: History" }));
    const historyLink = screen.getByRole("link", { name: "History" });

    historyLink.focus();
    fireEvent.keyDown(historyLink, { key: "ArrowDown" });

    expect(onNavigate).toHaveBeenCalledWith({
      href: "#compare",
      label: "Compare",
      value: "compare",
    });
    expect(document.activeElement).toBe(screen.getByRole("link", { name: "Compare" }));
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
