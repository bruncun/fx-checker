// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { SignUpForm } from "./sign-up-form";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

afterEach(() => {
  cleanup();
});

describe("SignUpForm", () => {
  it("offers guest mode from the sign-up page", () => {
    render(<SignUpForm />);

    expect(screen.getByRole("link", { name: "Try as guest" }).getAttribute("href")).toBe(
      "/guest"
    );
  });
});
