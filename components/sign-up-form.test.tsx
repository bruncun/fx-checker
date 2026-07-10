// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { SignUpForm } from "./sign-up-form";

const { fetchMock, routerPush } = vi.hoisted(() => ({
  fetchMock: vi.fn(),
  routerPush: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: routerPush,
  }),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});

describe("SignUpForm", () => {
  it("offers guest mode from the sign-up page", () => {
    render(<SignUpForm />);

    expect(screen.getByRole("link", { name: "Try as guest" }).getAttribute("href")).toBe("/guest");
  });

  it("keeps the loading state after successful sign-up navigation starts", async () => {
    fetchMock.mockResolvedValue({
      json: async () => ({ error: null, redirectTo: "/auth/sign-up-success" }),
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<SignUpForm />);

    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "user@example.test" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "password" } });
    fireEvent.change(screen.getByLabelText("Repeat Password"), {
      target: { value: "password" },
    });
    fireEvent.submit(screen.getByRole("button", { name: "Sign up" }));

    await waitFor(() => {
      expect(routerPush).toHaveBeenCalledWith("/auth/sign-up-success");
    });

    expect(screen.getByRole("button", { name: "Creating an account..." })).toHaveProperty(
      "disabled",
      true
    );
  });

  it("resets the loading state when sign-up fails", async () => {
    fetchMock.mockResolvedValue({
      json: async () => ({ error: "Email already registered" }),
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<SignUpForm />);

    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "user@example.test" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "password" } });
    fireEvent.change(screen.getByLabelText("Repeat Password"), {
      target: { value: "password" },
    });
    fireEvent.submit(screen.getByRole("button", { name: "Sign up" }));

    expect(await screen.findByText("Email already registered")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Sign up" })).toHaveProperty("disabled", false);
  });
});
