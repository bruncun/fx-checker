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

  it("swaps the delete icon on hover", () => {
    render(<DeleteButton />);

    const button = screen.getByRole("button", { name: "Delete" });
    const icons = button.querySelectorAll("span");

    expect(icons).toHaveLength(2);
    expect(icons[0]?.className).toContain("group-hover:hidden");
    expect(icons[1]?.className).toContain("group-hover:block");
    expect(button.querySelector('img[src="/images/icon-delete-dark.svg"]')).toBeTruthy();
    expect(button.querySelector('img[src="/images/icon-delete-filled-dark.svg"]')).toBeTruthy();
  });
});
