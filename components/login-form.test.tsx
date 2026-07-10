// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { getSafeRedirectPath, LoginForm } from "./login-form";

const { fetchMock, routerPush } = vi.hoisted(() => ({
  fetchMock: vi.fn(),
  routerPush: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: routerPush,
  }),
  useSearchParams: () => new URLSearchParams(),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});

describe("login form redirects", () => {
  it("defaults auth-page sign-ins to the dashboard", () => {
    expect(getSafeRedirectPath(null)).toBe("/app");
    expect(getSafeRedirectPath("https://example.test/app")).toBe("/app");
    expect(getSafeRedirectPath("//example.test/app")).toBe("/app");
  });

  it("keeps the loading state after successful sign-in navigation starts", async () => {
    fetchMock.mockResolvedValue({
      json: async () => ({ error: null, redirectTo: "/app" }),
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<LoginForm />);

    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "user@example.test" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "password" } });
    fireEvent.submit(screen.getByRole("button", { name: "Login" }));

    await waitFor(() => {
      expect(routerPush).toHaveBeenCalledWith("/app");
    });

    expect(screen.getByRole("button", { name: "Logging in..." })).toHaveProperty("disabled", true);
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
