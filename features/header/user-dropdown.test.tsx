// @vitest-environment jsdom

import * as React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { UserDropdown, getAccountInitials, getAccountMenuLabel } from "./user-dropdown";
import { KeyboardShortcutsProvider } from "@/features/keyboard-shortcuts";

const setTheme = vi.fn();
const routerPush = vi.fn();
const routerRefresh = vi.fn();

vi.mock("next-themes", () => ({
  useTheme: () => ({ setTheme, theme: "system" }),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: routerPush, refresh: routerRefresh }),
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
  routerRefresh.mockClear();
  vi.unstubAllGlobals();
});

describe("UserDropdown", () => {
  it("renders guest initials in a fixed circular account trigger", () => {
    render(<UserDropdown isGuest />);

    const trigger = screen.getByRole("button", { name: "Guest account menu" });

    expect(trigger.textContent).toBe("G");
    expect(trigger.className).toContain("size-400");
    expect(trigger.className).toContain("shrink-0");
    expect(trigger.className).toContain("items-center");
    expect(trigger.className).toContain("justify-center");
    expect(trigger.className).toContain("rounded-full");
    expect(trigger.className).toContain("bg-neutral-500");
  });

  it("uses the first email letter for signed-in users", () => {
    expect(getAccountInitials({ email: "mika@example.com" })).toBe("M");
  });

  it("labels the account trigger with the active account identity", () => {
    expect(getAccountMenuLabel({ email: " mika@example.com " })).toBe(
      "Account menu for mika@example.com"
    );
    expect(getAccountMenuLabel({ isGuest: true })).toBe("Guest account menu");
  });

  it("opens an account dialog with a theme toggle and sign out button", () => {
    render(<UserDropdown email="mika@example.com" />);

    fireEvent.click(screen.getByRole("button", { name: "Account menu for mika@example.com" }));

    expect(screen.getByRole("dialog", { name: "Account menu" })).toBeTruthy();
    expect(screen.getByRole("radiogroup", { name: "Theme" })).toBeTruthy();
    expect(screen.getByRole("radio", { name: "System" }).getAttribute("aria-checked")).toBe("true");
    expect(screen.getByRole("button", { name: "Sign out" })).toBeTruthy();
  });

  it("opens keyboard shortcuts from the account dialog, closes the menu, and restores focus to the account trigger", async () => {
    render(
      <KeyboardShortcutsProvider>
        <UserDropdown email="mika@example.com" />
      </KeyboardShortcutsProvider>
    );

    fireEvent.click(screen.getByRole("button", { name: "Account menu for mika@example.com" }));
    fireEvent.click(screen.getByRole("button", { name: "Keyboard Shortcuts" }));

    expect(screen.queryByRole("dialog", { name: "Account menu" })).toBeNull();
    await waitFor(() => {
      expect(screen.getByRole("dialog", { name: "Keyboard Shortcuts" })).toBeTruthy();
    });

    fireEvent.click(screen.getByRole("button", { name: "Close keyboard shortcuts" }));

    await waitFor(() => {
      expect(document.activeElement).toBe(
        screen.getByRole("button", { name: "Account menu for mika@example.com" })
      );
    });
  });

  it("closes the account dialog when signing out", () => {
    render(<UserDropdown email="mika@example.com" />);

    fireEvent.click(screen.getByRole("button", { name: "Account menu for mika@example.com" }));
    fireEvent.click(screen.getByRole("button", { name: "Sign out" }));

    expect(screen.queryByRole("dialog", { name: "Account menu" })).toBeNull();
  });

  it("shows a circular pending spinner in the account trigger while signing out", () => {
    vi.mocked(fetch).mockReturnValue(new Promise(() => {}));
    render(<UserDropdown email="mika@example.com" />);

    fireEvent.click(screen.getByRole("button", { name: "Account menu for mika@example.com" }));
    fireEvent.click(screen.getByRole("button", { name: "Sign out" }));

    const trigger = screen.getByRole("button", { name: "Signing out" });
    const spinner = trigger.querySelector("[data-pending-spinner]");
    const spinnerArc = spinner?.querySelector(".motion-safe\\:animate-spin");

    expect(trigger).toHaveProperty("disabled", true);
    expect(trigger.getAttribute("aria-busy")).toBe("true");
    expect(trigger.className).toContain("size-400");
    expect(trigger.className).toContain("bg-transparent");
    expect(spinner?.className).toContain("size-400");
    expect(spinner?.className).toContain("inset-0");
    expect(spinnerArc?.className).toContain("rounded-full");
  });

  it("keeps the pending state during sign-out navigation and resets when shown again", async () => {
    render(<UserDropdown email="mika@example.com" />);

    fireEvent.click(screen.getByRole("button", { name: "Account menu for mika@example.com" }));
    fireEvent.click(screen.getByRole("button", { name: "Sign out" }));

    await waitFor(() => {
      expect(routerPush).toHaveBeenCalledWith("/auth/login");
    });

    expect(screen.getByRole("button", { name: "Signing out" })).toHaveProperty("disabled", true);

    fireEvent(window, new Event("pageshow"));

    expect(
      screen.getByRole("button", { name: "Account menu for mika@example.com" })
    ).toHaveProperty("disabled", false);
  });

  it("restores the account trigger when sign out fails", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    vi.mocked(fetch).mockResolvedValue(new Response(null, { status: 500 }));
    render(<UserDropdown email="mika@example.com" />);

    fireEvent.click(screen.getByRole("button", { name: "Account menu for mika@example.com" }));
    fireEvent.click(screen.getByRole("button", { name: "Sign out" }));

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Account menu for mika@example.com" })
      ).toHaveProperty("disabled", false);
    });

    expect(routerPush).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it("moves through theme options with roving focus and switches theme on focus", () => {
    render(<UserDropdown email="mika@example.com" />);

    fireEvent.click(screen.getByRole("button", { name: "Account menu for mika@example.com" }));
    const systemTheme = screen.getByRole("radio", { name: "System" });

    systemTheme.focus();
    fireEvent.keyDown(systemTheme, { key: "ArrowRight" });

    expect(document.activeElement).toBe(screen.getByRole("radio", { name: "Dark" }));
    expect(setTheme).toHaveBeenCalledWith("dark");
  });

  it("moves through account menu options with vertical roving focus", () => {
    render(<UserDropdown email="mika@example.com" />);

    fireEvent.click(screen.getByRole("button", { name: "Account menu for mika@example.com" }));
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

  it("traps tab focus inside the account dialog until dismissed", async () => {
    render(<UserDropdown email="mika@example.com" />);

    fireEvent.click(screen.getByRole("button", { name: "Account menu for mika@example.com" }));
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

    const trigger = screen.getByRole("button", { name: "Account menu for mika@example.com" });

    fireEvent.click(trigger);
    fireEvent.keyDown(screen.getByRole("radio", { name: "System" }), { key: "Escape" });

    expect(screen.queryByRole("dialog", { name: "Account menu" })).toBeNull();
    await waitFor(() => {
      expect(document.activeElement).toBe(trigger);
    });
  });
});
