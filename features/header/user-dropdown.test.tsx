// @vitest-environment jsdom

import * as React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { UserDropdown } from "./user-dropdown";

const setTheme = vi.fn();
let mockTheme = "system";
const routerPush = vi.fn();
const routerReplace = vi.fn();
const routerRefresh = vi.fn();

vi.mock("next-themes", () => ({
  useTheme: () => ({ setTheme, theme: mockTheme }),
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
  mockTheme = "system";
  routerPush.mockClear();
  routerReplace.mockClear();
  routerRefresh.mockClear();
  vi.unstubAllGlobals();
});

describe("UserDropdown", () => {
  it("renders stable theme markup before mounting", () => {
    mockTheme = "dark";

    const html = renderToString(<UserDropdown isGuest />);

    expect(html).not.toContain('aria-label="Dark"');
    expect(html).not.toContain('aria-pressed="true"');
  });

  it("renders the resolved theme after mounting", () => {
    mockTheme = "dark";

    render(<UserDropdown isGuest />);
    fireEvent.click(screen.getByRole("button", { name: "Account menu" }));

    expect(screen.getByRole("radio", { name: "Dark" }).getAttribute("aria-checked")).toBe("true");
  });

  it("renders an account trigger with a large-screen menu label for guest users", () => {
    render(<UserDropdown isGuest />);

    const trigger = screen.getByRole("button", { name: "Account menu" });

    expect(trigger.textContent).toBe("Account");
    expect(trigger.className).toContain("h-400");
    expect(trigger.className).toContain("shrink-0");
    expect(trigger.className).toContain("items-center");
    expect(trigger.className).toContain("justify-center");
    expect(trigger.className).toContain("rounded-8");
    expect(trigger.className).toContain("bg-neutral-500");
    expect(
      Array.from(trigger.querySelectorAll("span")).find((span) => span.textContent === "Account")
        ?.className
    ).toContain("sm:inline");
    expect(trigger.querySelectorAll("svg")).toHaveLength(2);
  });

  it("opens an account dialog with a theme toggle and sign out button", () => {
    render(<UserDropdown />);

    fireEvent.click(screen.getByRole("button", { name: "Account menu" }));

    expect(screen.getByRole("dialog", { name: "Account menu" })).toBeTruthy();
    expect(screen.getByRole("radiogroup", { name: "Theme" })).toBeTruthy();
    expect(screen.getAllByRole("radio", { name: "System" })[0].getAttribute("aria-checked")).toBe(
      "true"
    );
    expect(screen.getAllByRole("button", { name: "Sign out" })[0]).toBeTruthy();
  });

  it("opens an account dialog with auth links for guest users", () => {
    render(<UserDropdown isGuest />);

    fireEvent.click(screen.getByRole("button", { name: "Account menu" }));

    expect(screen.getByRole("dialog", { name: "Account menu" })).toBeTruthy();
    expect(screen.getAllByRole("link", { name: "Log in" })[0].getAttribute("href")).toBe(
      "/auth/login"
    );
    expect(screen.getAllByRole("link", { name: "Sign up" })[0].getAttribute("href")).toBe(
      "/auth/sign-up"
    );
    expect(screen.queryByRole("button", { name: "Sign out" })).toBeNull();
  });

  it("closes the account dialog when signing out", () => {
    render(<UserDropdown />);

    fireEvent.click(screen.getByRole("button", { name: "Account menu" }));
    fireEvent.click(screen.getAllByRole("button", { name: "Sign out" })[0]);

    expect(screen.queryByRole("dialog", { name: "Account menu" })).toBeNull();
  });

  it("shows a transitional text label in the account trigger while signing out", () => {
    vi.mocked(fetch).mockReturnValue(new Promise(() => {}));
    render(<UserDropdown />);

    fireEvent.click(screen.getByRole("button", { name: "Account menu" }));
    fireEvent.click(screen.getAllByRole("button", { name: "Sign out" })[0]);

    const trigger = screen.getAllByRole("button", { name: "Exiting..." })[0];

    expect(trigger).toHaveProperty("disabled", true);
    expect(trigger.getAttribute("aria-busy")).toBe("true");
    expect(trigger.className).toContain("h-400");
    expect(trigger.className).toContain("disabled:pointer-events-none");
    expect(trigger.textContent).toBe("Exiting...");
    expect(trigger.querySelector("[data-pending-spinner]")).toBeNull();
  });

  it("resets the pending state when sign-out navigation completes", async () => {
    render(<UserDropdown />);

    fireEvent.click(screen.getByRole("button", { name: "Account menu" }));
    fireEvent.click(screen.getAllByRole("button", { name: "Sign out" })[0]);

    await waitFor(() => {
      expect(routerReplace).toHaveBeenCalledWith("/auth/login");
    });

    expect(screen.getByRole("button", { name: "Account menu" })).toHaveProperty("disabled", false);
  });

  it("restores the account trigger when sign out fails", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    vi.mocked(fetch).mockResolvedValue(new Response(null, { status: 500 }));
    render(<UserDropdown />);

    fireEvent.click(screen.getByRole("button", { name: "Account menu" }));
    fireEvent.click(screen.getAllByRole("button", { name: "Sign out" })[0]);

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
    render(<UserDropdown />);

    fireEvent.click(screen.getByRole("button", { name: "Account menu" }));
    const systemTheme = screen.getAllByRole("radio", { name: "System" })[0];

    systemTheme.focus();
    fireEvent.keyDown(systemTheme, { key: "ArrowRight" });

    const darkTheme = screen.getAllByRole("radio", { name: "Dark" })[0];

    expect(document.activeElement).toBe(darkTheme);
    expect(setTheme).toHaveBeenCalledWith("dark");

    fireEvent.keyDown(darkTheme, { key: "ArrowDown" });

    expect(document.activeElement).toBe(screen.getAllByRole("button", { name: "Sign out" })[0]);
  });

  it("moves through account menu options with vertical roving focus", () => {
    render(<UserDropdown />);

    fireEvent.click(screen.getByRole("button", { name: "Account menu" }));
    const systemTheme = screen.getAllByRole("radio", { name: "System" })[0];
    const signOutButton = screen.getAllByRole("button", { name: "Sign out" })[0];

    systemTheme.focus();
    fireEvent.keyDown(systemTheme, { key: "ArrowDown" });

    expect(document.activeElement).toBe(signOutButton);
    expect(signOutButton.tabIndex).toBe(0);
    expect(systemTheme.tabIndex).toBe(-1);

    fireEvent.keyDown(signOutButton, { key: "ArrowDown" });
    expect(document.activeElement).toBe(systemTheme);
  });

  it("moves through guest auth links with vertical roving focus", () => {
    render(<UserDropdown isGuest />);

    fireEvent.click(screen.getByRole("button", { name: "Account menu" }));
    const systemTheme = screen.getAllByRole("radio", { name: "System" })[0];
    const loginLink = screen.getAllByRole("link", { name: "Log in" })[0];
    const signUpLink = screen.getAllByRole("link", { name: "Sign up" })[0];

    systemTheme.focus();
    fireEvent.keyDown(systemTheme, { key: "ArrowDown" });

    expect(document.activeElement).toBe(loginLink);

    fireEvent.keyDown(loginLink, { key: "ArrowDown" });
    expect(document.activeElement).toBe(signUpLink);

    fireEvent.keyDown(signUpLink, { key: "ArrowDown" });
    expect(document.activeElement).toBe(systemTheme);
  });

  it("traps tab focus inside the account dialog until dismissed", async () => {
    render(<UserDropdown />);

    fireEvent.click(screen.getByRole("button", { name: "Account menu" }));
    const systemTheme = screen.getAllByRole("radio", { name: "System" })[0];
    const signOutButton = screen.getAllByRole("button", { name: "Sign out" })[0];

    await waitFor(() => {
      expect(document.activeElement).toBe(systemTheme);
    });

    fireEvent.keyDown(document.activeElement as HTMLElement, { key: "Tab" });

    expect(document.activeElement).toBe(signOutButton);

    fireEvent.keyDown(signOutButton, { key: "Tab" });
    expect(document.activeElement).toBe(systemTheme);

    fireEvent.keyDown(systemTheme, { key: "Tab", shiftKey: true });
    expect(document.activeElement).toBe(signOutButton);
  });

  it("closes the account dialog with Escape and restores trigger focus", async () => {
    render(<UserDropdown />);

    const trigger = screen.getByRole("button", { name: "Account menu" });

    fireEvent.click(trigger);
    fireEvent.keyDown(screen.getAllByRole("radio", { name: "System" })[0], { key: "Escape" });

    expect(screen.queryByRole("dialog", { name: "Account menu" })).toBeNull();
    await waitFor(() => {
      expect(document.activeElement).toBe(trigger);
    });
  });
});
