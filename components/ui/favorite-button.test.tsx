// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import * as React from "react";
import { afterEach, describe, expect, it } from "vitest";

import { FavoriteButton } from "./favorite-button";

afterEach(() => {
  cleanup();
});

describe("FavoriteButton", () => {
  it("renders an unpinned outline icon", () => {
    render(<FavoriteButton />);

    const button = screen.getByRole("button", { name: "Favorite" });

    expect(button.querySelectorAll("svg")).toHaveLength(1);
  });

  it("renders one unpinned icon for the icon variant", () => {
    render(<FavoriteButton variant="icon" />);

    const button = screen.getByRole("button", { name: "Favorite" });

    expect(button.querySelectorAll("svg")).toHaveLength(1);
  });

  it("restores the original pinned styling for the default variant", () => {
    render(<FavoriteButton pinned />);

    const button = screen.getByRole("button", { name: "Favorited" });

    expect(button.className).toContain("!bg-lime-500");
    expect(button.className).toContain("text-neutral-900");
    expect(button.className).toContain("shadow-none");
    expect(button.className).toContain("hover:!bg-lime-500");
    expect(button.className).toContain("hover:opacity-80");
  });

  it("uses the neutral 700 focus gap for the default converter action", () => {
    render(<FavoriteButton />);

    const button = screen.getByRole("button", { name: "Favorite" });

    expect(button.className).toContain(
      "focus-visible:shadow-[inset_0_0_0_1px_hsl(var(--neutral-400)),0_0_0_3px_hsl(var(--neutral-700)),0_0_0_4px_hsl(var(--lime-500))]"
    );
  });

  it("keeps the pinned icon variant structurally outlined with a primary star", () => {
    render(<FavoriteButton pinned variant="icon" />);

    const button = screen.getByRole("button", { name: "Favorited" });

    expect(button.className).toContain("shadow-[inset_0_0_0_1px_hsl(var(--lime-500))]");
    expect(button.className).not.toContain("!bg-lime-500");
    expect(button.className).not.toContain("text-neutral-900");
    expect(button.querySelector("span")?.className).toContain("text-lime-500");
    expect(button.querySelectorAll("svg")).toHaveLength(1);
  });

  it("keeps the neutral 600 focus gap for icon row actions", () => {
    render(<FavoriteButton variant="icon" />);

    const button = screen.getByRole("button", { name: "Favorite" });

    expect(button.className).toContain(
      "focus-visible:shadow-[inset_0_0_0_1px_hsl(var(--neutral-400)),0_0_0_3px_hsl(var(--neutral-600)),0_0_0_4px_hsl(var(--lime-500))]"
    );
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
