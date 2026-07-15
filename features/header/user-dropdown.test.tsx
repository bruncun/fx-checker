// @vitest-environment jsdom

import * as React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { UserDropdown } from "./user-dropdown";
import { KeyboardShortcutsProvider } from "@/features/keyboard-shortcuts";

const setTheme = vi.fn();
const routerPush = vi.fn();
const routerReplace = vi.fn();
const routerRefresh = vi.fn();

vi.mock("next-themes", () => ({
  useTheme: () => ({ setTheme, theme: "system" }),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: routerPush, refresh: routerRefresh, replace: routerReplace }),
}));

vi.mock("@/features/home/hooks/use-data-unavailable-error", () => ({
  useDataUnavailableError: () => vi.fn(),
}));

beforeEach(() => {
  vi.stubGlobal(
    "fetch",
    vi.fn(() => Promise.resolve(new Response(null, { status: 200 })))
  );
});

afterEach(() => {
  cleanup();
  setTheme.mockClear();
  routerPush.mockClear();
  routerReplace.mockClear();
  routerRefresh.mockClear();
  vi.unstubAllGlobals();
});

describe("UserDropdown", () => {
  it("renders a neutral menu trigger for guest users", () => {
    render(<UserDropdown isGuest />);

    const trigger = screen.getByRole("button", { name: "Account menu" });

    expect(trigger.textContent).toContain("Menu");
    expect(trigger.className).toContain("h-400");
    expect(trigger.className).toContain("shrink-0");
    expect(trigger.className).toContain("items-center");
    expect(trigger.className).toContain("justify-center");
    expect(trigger.className).toContain("rounded-8");
    expect(trigger.className).toContain("bg-neutral-500");
  });

  it("opens an account dialog with a theme toggle and sign out button", () => {
    render(<UserDropdown email="mika@example.com" />);

    fireEvent.click(screen.getByRole("button", { name: "Account menu" }));

    expect(screen.getByRole("dialog", { name: "Account menu" })).toBeTruthy();
    expect(screen.getByRole("radiogroup", { name: "Theme" })).toBeTruthy();
    expect(screen.getByRole("radio", { name: "System" }).getAttribute("aria-checked")).toBe("true");
    expect(screen.getByRole("button", { name: "Sign out" })).toBeTruthy();
  });

  it("opens an account dialog with auth links for guest users", () => {
    render(<UserDropdown isGuest />);

    fireEvent.click(screen.getByRole("button", { name: "Account menu" }));

    expect(screen.getByRole("dialog", { name: "Account menu" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Log in" }).getAttribute("href")).toBe("/auth/login");
    expect(screen.getByRole("link", { name: "Sign up" }).getAttribute("href")).toBe(
      "/auth/sign-up"
    );
    expect(screen.queryByRole("button", { name: "Sign out" })).toBeNull();
  });

  it("opens keyboard shortcuts from the account dialog, closes the menu, and restores focus to the account trigger", async () => {
    render(
      <KeyboardShortcutsProvider>
        <UserDropdown email="mika@example.com" />
      </KeyboardShortcutsProvider>
    );

    fireEvent.click(screen.getByRole("button", { name: "Account menu" }));
    fireEvent.click(screen.getByRole("button", { name: "Keyboard Shortcuts" }));

    expect(screen.queryByRole("dialog", { name: "Account menu" })).toBeNull();
    await waitFor(() => {
      expect(screen.getByRole("dialog", { name: "Keyboard Shortcuts" })).toBeTruthy();
    });

    fireEvent.click(screen.getByRole("button", { name: "Close keyboard shortcuts" }));

    await waitFor(() => {
      expect(document.activeElement).toBe(screen.getByRole("button", { name: "Account menu" }));
    });
  });

  it("closes the account dialog when signing out", () => {
    render(<UserDropdown email="mika@example.com" />);

    fireEvent.click(screen.getByRole("button", { name: "Account menu" }));
    fireEvent.click(screen.getByRole("button", { name: "Sign out" }));

    expect(screen.queryByRole("dialog", { name: "Account menu" })).toBeNull();
  });

  it("shows a transitional text label in the account trigger while signing out", () => {
    vi.mocked(fetch).mockReturnValue(new Promise(() => {}));
    render(<UserDropdown email="mika@example.com" />);

    fireEvent.click(screen.getByRole("button", { name: "Account menu" }));
    fireEvent.click(screen.getByRole("button", { name: "Sign out" }));

    const trigger = screen.getByRole("button", { name: "Exiting..." });

    expect(trigger).toHaveProperty("disabled", true);
    expect(trigger.getAttribute("aria-busy")).toBe("true");
    expect(trigger.className).toContain("h-400");
    expect(trigger.className).toContain("disabled:pointer-events-none");
    expect(trigger.textContent).toBe("Exiting...");
    expect(trigger.querySelector("[data-pending-spinner]")).toBeNull();
  });

  it("resets the pending state when sign-out navigation completes", async () => {
    render(<UserDropdown email="mika@example.com" />);

    fireEvent.click(screen.getByRole("button", { name: "Account menu" }));
    fireEvent.click(screen.getByRole("button", { name: "Sign out" }));

    await waitFor(() => {
      expect(routerReplace).toHaveBeenCalledWith("/auth/login");
    });

    expect(screen.getByRole("button", { name: "Account menu" })).toHaveProperty("disabled", false);
  });

  it("restores the account trigger when sign out fails", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    vi.mocked(fetch).mockResolvedValue(new Response(null, { status: 500 }));
    render(<UserDropdown email="mika@example.com" />);

    fireEvent.click(screen.getByRole("button", { name: "Account menu" }));
    fireEvent.click(screen.getByRole("button", { name: "Sign out" }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Account menu" })).toHaveProperty(
        "disabled",
        false
      );
    });

    expect(routerReplace).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it("moves through theme options with roving focus and switches theme on focus", () => {
    render(<UserDropdown email="mika@example.com" />);

    fireEvent.click(screen.getByRole("button", { name: "Account menu" }));
    const systemTheme = screen.getByRole("radio", { name: "System" });

    systemTheme.focus();
    fireEvent.keyDown(systemTheme, { key: "ArrowRight" });

    expect(document.activeElement).toBe(screen.getByRole("radio", { name: "Dark" }));
    expect(setTheme).toHaveBeenCalledWith("dark");
  });

  it("moves through account menu options with vertical roving focus", () => {
    render(<UserDropdown email="mika@example.com" />);

    fireEvent.click(screen.getByRole("button", { name: "Account menu" }));
    const systemTheme = screen.getByRole("radio", { name: "System" });
    const shortcutsButton = screen.getByRole("button", { name: "Keyboard Shortcuts" });
    const signOutButton = screen.getByRole("button", { name: "Sign out" });

    systemTheme.focus();
    fireEvent.keyDown(systemTheme, { key: "ArrowDown" });

    expect(document.activeElement).toBe(screen.getByRole("radio", { name: "Dark" }));

    fireEvent.keyDown(document.activeElement as HTMLElement, { key: "ArrowDown" });
    fireEvent.keyDown(document.activeElement as HTMLElement, { key: "ArrowDown" });

    expect(document.activeElement).toBe(shortcutsButton);
    expect(shortcutsButton.tabIndex).toBe(0);
    expect(systemTheme.tabIndex).toBe(-1);

    fireEvent.keyDown(shortcutsButton, { key: "ArrowDown" });
    expect(document.activeElement).toBe(signOutButton);

    fireEvent.keyDown(signOutButton, { key: "ArrowDown" });
    expect(document.activeElement).toBe(systemTheme);
  });

  it("moves through guest auth links with vertical roving focus", () => {
    render(<UserDropdown isGuest />);

    fireEvent.click(screen.getByRole("button", { name: "Account menu" }));
    const systemTheme = screen.getByRole("radio", { name: "System" });
    const shortcutsButton = screen.getByRole("button", { name: "Keyboard Shortcuts" });
    const loginLink = screen.getByRole("link", { name: "Log in" });
    const signUpLink = screen.getByRole("link", { name: "Sign up" });

    shortcutsButton.focus();
    fireEvent.keyDown(shortcutsButton, { key: "ArrowDown" });

    expect(document.activeElement).toBe(loginLink);

    fireEvent.keyDown(loginLink, { key: "ArrowDown" });
    expect(document.activeElement).toBe(signUpLink);

    fireEvent.keyDown(signUpLink, { key: "ArrowDown" });
    expect(document.activeElement).toBe(systemTheme);
  });

  it("traps tab focus inside the account dialog until dismissed", async () => {
    render(<UserDropdown email="mika@example.com" />);

    fireEvent.click(screen.getByRole("button", { name: "Account menu" }));
    const systemTheme = screen.getByRole("radio", { name: "System" });
    const shortcutsButton = screen.getByRole("button", { name: "Keyboard Shortcuts" });
    const signOutButton = screen.getByRole("button", { name: "Sign out" });

    await waitFor(() => {
      expect(document.activeElement).toBe(systemTheme);
    });

    fireEvent.keyDown(systemTheme, { key: "Tab" });
    fireEvent.keyDown(document.activeElement as HTMLElement, { key: "Tab" });
    fireEvent.keyDown(document.activeElement as HTMLElement, { key: "Tab" });

    expect(document.activeElement).toBe(shortcutsButton);

    fireEvent.keyDown(shortcutsButton, { key: "Tab" });
    expect(document.activeElement).toBe(signOutButton);

    fireEvent.keyDown(signOutButton, { key: "Tab" });
    expect(document.activeElement).toBe(systemTheme);

    fireEvent.keyDown(systemTheme, { key: "Tab", shiftKey: true });
    expect(document.activeElement).toBe(signOutButton);
  });

  it("closes the account dialog with Escape and restores trigger focus", async () => {
    render(<UserDropdown email="mika@example.com" />);

    const trigger = screen.getByRole("button", { name: "Account menu" });

    fireEvent.click(trigger);
    fireEvent.keyDown(screen.getByRole("radio", { name: "System" }), { key: "Escape" });

    expect(screen.queryByRole("dialog", { name: "Account menu" })).toBeNull();
    await waitFor(() => {
      expect(document.activeElement).toBe(trigger);
    });
  });
});
