// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import * as React from "react";
import { afterEach, describe, expect, it } from "vitest";

import { FavoriteButton } from "./favorite-button";

afterEach(() => {
  cleanup();
});

describe("FavoriteButton", () => {
  it("restores the original pinned styling for the default variant", () => {
    render(<FavoriteButton pinned />);

    const button = screen.getByRole("button", { name: "Favorited" });

    expect(button.className).toContain("!bg-lime-500");
    expect(button.className).toContain("text-neutral-900");
    expect(button.className).toContain("shadow-none");
    expect(button.className).toContain("hover:!bg-lime-500");
    expect(button.className).toContain("hover:opacity-80");
  });

  it("keeps the icon variant pinned styling separate from the default fill", () => {
    render(<FavoriteButton pinned variant="icon" />);

    const button = screen.getByRole("button", { name: "Favorited" });

    expect(button.className).toContain("shadow-[inset_0_0_0_1px_hsl(var(--lime-500))]");
    expect(button.className).not.toContain("!bg-lime-500");
    expect(button.className).not.toContain("text-neutral-900");
  });

  it("keeps the original disabled styling for the default variant", () => {
    render(<FavoriteButton disabled />);

    const button = screen.getByRole("button", { name: "Favorite" });

    expect(button.className).toContain("disabled:!bg-neutral-600");
    expect(button.className).toContain("disabled:![color:hsl(var(--neutral-200))]");
    expect(button.className).toContain("disabled:!opacity-100");
    expect(button.className).toContain(
      "disabled:!shadow-[inset_0_0_0_1px_hsl(var(--neutral-300))]"
    );
  });
});
