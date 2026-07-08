// @vitest-environment jsdom

import * as React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { UserDropdown, getAccountInitials } from "./user-dropdown";

const setTheme = vi.fn();

vi.mock("next-themes", () => ({
  useTheme: () => ({ setTheme, theme: "system" }),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

vi.mock("@/features/home/components/use-data-unavailable-error", () => ({
  useDataUnavailableError: () => vi.fn(),
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      signOut: vi.fn().mockResolvedValue({ error: null }),
    },
  }),
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

  it("opens an account dialog with a theme toggle and sign out link", () => {
    render(<UserDropdown email="mika@example.com" />);

    fireEvent.click(screen.getByRole("button", { name: "Account menu" }));

    expect(screen.getByRole("dialog", { name: "Account menu" })).toBeTruthy();
    expect(screen.getByRole("radiogroup", { name: "Theme" })).toBeTruthy();
    expect(screen.getByRole("radio", { name: "System" }).getAttribute("aria-checked")).toBe("true");
    expect(screen.getByRole("link", { name: "Sign out" }).getAttribute("href")).toBe(
      "/auth/sign-out"
    );
  });

  it("closes the account dialog when signing out", () => {
    render(<UserDropdown email="mika@example.com" />);

    fireEvent.click(screen.getByRole("button", { name: "Account menu" }));
    fireEvent.click(screen.getByRole("link", { name: "Sign out" }));

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
});
