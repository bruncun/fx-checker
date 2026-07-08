// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import * as React from "react";
import { afterEach, describe, expect, it } from "vitest";

import { LogConversionButton } from "./log-conversion-button";

afterEach(() => {
  cleanup();
});

describe("LogConversionButton", () => {
  it("marks the pressed check icon for theme-aware filtering", () => {
    render(<LogConversionButton pressed />);

    const button = screen.getByRole("button", { name: "Logged" });

    expect(button.getAttribute("aria-pressed")).toBe("true");
    expect(button.querySelector("span")?.className).toContain("fx-log-conversion-check");
    expect(button.querySelector("span")?.className).not.toContain("brightness-0");
    expect(button.querySelector('img[src="/images/icon-check.svg"]')).toBeTruthy();
    expect(button.querySelector('img[src="/images/icon-check-dark.svg"]')).toBeTruthy();
  });
});
