// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import * as React from "react";
import { afterEach, describe, expect, it } from "vitest";

import { DeleteButton } from "./delete-button";

afterEach(() => {
  cleanup();
});

describe("DeleteButton", () => {
  it("uses an accessible delete label by default", () => {
    render(<DeleteButton />);

    expect(screen.getByRole("button", { name: "Delete" })).toBeTruthy();
  });

  it("crossfades the delete icon on hover", () => {
    render(<DeleteButton />);

    const button = screen.getByRole("button", { name: "Delete" });
    const icons = button.querySelectorAll("span");

    expect(icons).toHaveLength(2);
    expect(icons[0]?.className).toContain("opacity-100");
    expect(icons[0]?.className).toContain("group-hover:opacity-0");
    expect(icons[1]?.className).toContain("opacity-0");
    expect(icons[1]?.className).toContain("group-hover:opacity-100");
    expect(button.querySelectorAll("svg")).toHaveLength(2);
  });
});
