// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { UpdatePasswordForm } from "./update-password-form";

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

describe("UpdatePasswordForm", () => {
  it("keeps the pending state during update navigation and resets when shown again", async () => {
    fetchMock.mockResolvedValue({
      json: async () => ({ error: null, redirectTo: "/auth/login" }),
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<UpdatePasswordForm />);

    fireEvent.change(screen.getByLabelText("New password"), {
      target: { value: "updated-password" },
    });
    fireEvent.submit(screen.getByRole("button", { name: "Save new password" }));

    await waitFor(() => {
      expect(routerPush).toHaveBeenCalledWith("/auth/login");
    });

    expect(screen.getByLabelText("New password")).toHaveProperty("value", "updated-password");
    expect(screen.getByRole("button", { name: "Saving..." })).toHaveProperty("disabled", true);

    fireEvent(window, new Event("pageshow"));

    expect(screen.getByLabelText("New password")).toHaveProperty("value", "");
    expect(screen.getByRole("button", { name: "Save new password" })).toHaveProperty(
      "disabled",
      false
    );
  });
});
