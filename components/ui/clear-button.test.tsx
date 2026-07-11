// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import * as React from "react";
import { afterEach, describe, expect, it } from "vitest";

import { ClearButton } from "./clear-button";

afterEach(() => {
  cleanup();
});

describe("ClearButton", () => {
  it("renders the clear all label by default", () => {
    render(<ClearButton />);

    expect(screen.getByRole("button", { name: "Clear all" })).toBeTruthy();
  });

  it("uses neutral 200 text on the shared interactive surface", () => {
    render(<ClearButton />);

    const button = screen.getByRole("button", { name: "Clear all" });

    expect(button.className).toContain("text-neutral-200");
    expect(button.className).toContain("bg-neutral-500");
    expect(button.className).toContain("hover:bg-neutral-400");
  });

  it("uses the neutral 700 focus gap for rate details headers", () => {
    render(<ClearButton />);

    const button = screen.getByRole("button", { name: "Clear all" });

    expect(button.className).toContain(
      "focus-visible:shadow-[inset_0_0_0_1px_hsl(var(--neutral-400)),0_0_0_3px_hsl(var(--neutral-700)),0_0_0_4px_hsl(var(--lime-500))]"
    );
  });
});
