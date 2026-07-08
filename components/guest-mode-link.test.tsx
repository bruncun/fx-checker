// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { GuestModeLink } from "./guest-mode-link";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("GuestModeLink", () => {
  it("shows a pending label after starting guest mode", () => {
    render(<GuestModeLink />);

    const link = screen.getByRole("link", { name: "Try as guest" });
    expect(link.getAttribute("href")).toBe("/guest");
  });

  it("shows a pending label after activating guest mode", () => {
    vi.useFakeTimers();
    render(<GuestModeLink href="#guest" />);

    fireEvent.click(screen.getByRole("link", { name: "Try as guest" }));

    expect(screen.getByRole("link", { name: "Entering guest mode..." })).toBeTruthy();
  });

  it("navigates to guest mode as a document visit after showing pending state", () => {
    vi.useFakeTimers();
    const navigate = vi.fn();
    render(<GuestModeLink href="/guest?redirectTo=%2Fapp" navigate={navigate} />);

    fireEvent.click(screen.getByRole("link", { name: "Try as guest" }));
    vi.runAllTimers();

    expect(navigate).toHaveBeenCalledWith("/guest?redirectTo=%2Fapp");
  });
});
