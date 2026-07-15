// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AuthModal } from "./auth-modal";

const routerReplace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: routerReplace }),
}));

afterEach(() => {
  cleanup();
  routerReplace.mockClear();
});

describe("AuthModal", () => {
  it("dismisses auth modal routes back to the app root", () => {
    render(<AuthModal title="Login">Content</AuthModal>);

    fireEvent.click(screen.getByRole("button", { name: "Close login" }));

    expect(routerReplace).toHaveBeenCalledWith("/");
  });
});
