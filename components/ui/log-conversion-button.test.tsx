// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import * as React from "react";
import { afterEach, describe, expect, it } from "vitest";

import { LogConversionButton } from "./log-conversion-button";

afterEach(() => {
  cleanup();
});

describe("LogConversionButton", () => {
  it("renders a single pressed check icon", () => {
    render(<LogConversionButton pressed />);

    const button = screen.getByRole("button", { name: "Logged" });

    expect(button.getAttribute("aria-pressed")).toBe("true");
    expect(button.querySelectorAll("svg")).toHaveLength(1);
  });
});
