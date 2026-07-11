// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import * as React from "react";
import { afterEach, describe, expect, it } from "vitest";

import { Flag } from "./flag";

afterEach(() => {
  cleanup();
});

describe("Flag", () => {
  it("lazy loads by default", () => {
    render(<Flag countryCode="gb" />);

    expect(screen.getByRole("img", { name: "United Kingdom" }).getAttribute("loading")).toBe(
      "lazy"
    );
  });

  it("allows eager loading for immediately visible flags", () => {
    render(<Flag countryCode="us" loading="eager" />);

    expect(screen.getByRole("img", { name: "United States" }).getAttribute("loading")).toBe(
      "eager"
    );
  });
});
