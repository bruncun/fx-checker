// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ForgotPasswordForm } from "./forgot-password-form";

const { fetchMock } = vi.hoisted(() => ({
  fetchMock: vi.fn(),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});

describe("ForgotPasswordForm", () => {
  it("resets the form state after a reset email is sent", async () => {
    fetchMock.mockResolvedValue({
      json: async () => ({ error: null, success: true }),
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<ForgotPasswordForm />);

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "user@example.test" },
    });
    fireEvent.submit(screen.getByRole("button", { name: "Send reset email" }));

    expect(await screen.findByText(/you will receive a password reset email/i)).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Sending..." })).toBeNull();

    fireEvent(window, new Event("pageshow"));

    expect(screen.getByRole("button", { name: "Send reset email" })).toHaveProperty(
      "disabled",
      false
    );
    expect(screen.getByLabelText("Email")).toHaveProperty("value", "");
  });
});
