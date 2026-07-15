// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { getSafeRedirectPath, LoginForm } from "./login-form";

const { fetchMock } = vi.hoisted(() => ({
  fetchMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});

describe("login form redirects", () => {
  it("defaults auth-page sign-ins to the dashboard", () => {
    expect(getSafeRedirectPath(null)).toBe("/");
    expect(getSafeRedirectPath("https://example.test/app")).toBe("/");
    expect(getSafeRedirectPath("//example.test/app")).toBe("/");
    expect(getSafeRedirectPath("/app?amount=1000")).toBe("/?amount=1000");
  });

  it("keeps the pending state during sign-in navigation and resets when shown again", async () => {
    fetchMock.mockResolvedValue({
      json: async () => ({ error: null, redirectTo: "/" }),
    });
    vi.stubGlobal("fetch", fetchMock);
    const navigate = vi.fn();

    render(<LoginForm navigate={navigate} />);

    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "user@example.test" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "password" } });
    fireEvent.submit(screen.getByRole("button", { name: "Login" }));

    await waitFor(() => {
      expect(navigate).toHaveBeenCalledWith("/");
    });

    expect(screen.getByLabelText("Email")).toHaveProperty("value", "user@example.test");
    expect(screen.getByLabelText("Password")).toHaveProperty("value", "password");
    expect(screen.getByRole("button", { name: "Logging in..." })).toHaveProperty("disabled", true);

    fireEvent(window, new Event("pageshow"));

    expect(screen.getByLabelText("Email")).toHaveProperty("value", "");
    expect(screen.getByLabelText("Password")).toHaveProperty("value", "");
    expect(screen.getByRole("button", { name: "Login" })).toHaveProperty("disabled", false);
  });

  it("resets the loading state when sign-in fails", async () => {
    fetchMock.mockResolvedValue({
      json: async () => ({ error: "Invalid credentials" }),
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<LoginForm />);

    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "user@example.test" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "password" } });
    fireEvent.submit(screen.getByRole("button", { name: "Login" }));

    expect(await screen.findByText("Invalid credentials")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Login" })).toHaveProperty("disabled", false);
  });
});
