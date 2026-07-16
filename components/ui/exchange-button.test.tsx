// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import * as React from "react";
import { afterEach, describe, expect, it } from "vitest";

import { ExchangeButton } from "./exchange-button";

afterEach(() => {
  cleanup();
});

describe("ExchangeButton", () => {
  it("uses an accessible exchange label by default", () => {
    render(<ExchangeButton />);

    expect(screen.getByRole("button", { name: "Exchange currencies" })).toBeTruthy();
  });

  it("uses the neutral 700 focus gap between converter amount panels", () => {
    render(<ExchangeButton />);

    const button = screen.getByRole("button", { name: "Exchange currencies" });

    expect(button.className).toContain(
      "focus-visible:shadow-[inset_0_0_0_1px_hsl(var(--neutral-400)),0_0_0_3px_hsl(var(--neutral-700)),0_0_0_4px_hsl(var(--lime-500))]"
    );
  });

  it("shows only the vertical exchange icon below the small breakpoint", () => {
    render(<ExchangeButton />);

    const button = screen.getByRole("button", { name: "Exchange currencies" });
    const [horizontalIconWrapper, verticalIcon] = Array.from(button.children);

    expect(horizontalIconWrapper.className).toContain("hidden");
    expect(horizontalIconWrapper.className).toContain("sm:block");
    expect(verticalIcon.className).toContain("sm:hidden");
  });
});
