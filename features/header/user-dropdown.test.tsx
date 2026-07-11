// @vitest-environment jsdom

import * as React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { UserDropdown, getAccountInitials } from "./user-dropdown";
import { KeyboardShortcutsProvider } from "@/features/keyboard-shortcuts";

const setTheme = vi.fn();

vi.mock("next-themes", () => ({
  useTheme: () => ({ setTheme, theme: "system" }),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

vi.mock("@/features/home/hooks/use-data-unavailable-error", () => ({
  useDataUnavailableError: () => vi.fn(),
}));

afterEach(() => {
  cleanup();
  setTheme.mockClear();
});

describe("UserDropdown", () => {
  it("renders guest initials in a fixed circular account trigger", () => {
    render(<UserDropdown isGuest />);

    const trigger = screen.getByRole("button", { name: "Account menu" });

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

  it("opens an account dialog with a theme toggle and sign out button", () => {
    render(<UserDropdown email="mika@example.com" />);

    fireEvent.click(screen.getByRole("button", { name: "Account menu" }));

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
