// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
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
  it("keeps the pending state during reset navigation and resets when shown again", async () => {
    fetchMock.mockResolvedValue({
      json: async () => ({ error: null, success: true }),
    });
    vi.stubGlobal("fetch", fetchMock);
    const navigate = vi.fn();

    render(<ForgotPasswordForm navigate={navigate} />);

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "user@example.test" },
    });
    fireEvent.submit(screen.getByRole("button", { name: "Send reset email" }));

    await waitFor(() => {
      expect(navigate).toHaveBeenCalledWith("/auth/forgot-password/sent");
    });

    expect(screen.getByLabelText("Email")).toHaveProperty("value", "user@example.test");
    expect(screen.getByRole("button", { name: "Sending..." })).toHaveProperty("disabled", true);

    fireEvent(window, new Event("pageshow"));

    expect(screen.getByRole("button", { name: "Send reset email" })).toHaveProperty(
      "disabled",
      false
    );
    expect(screen.getByLabelText("Email")).toHaveProperty("value", "");
  });

  it("resets the loading state when reset request fails", async () => {
    fetchMock.mockResolvedValue({
      json: async () => ({ error: "Email service unavailable", success: false }),
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<ForgotPasswordForm />);

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "user@example.test" },
    });
    fireEvent.submit(screen.getByRole("button", { name: "Send reset email" }));

    expect(await screen.findByText("Email service unavailable")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Send reset email" })).toHaveProperty(
      "disabled",
      false
    );
  });
});
