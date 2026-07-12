// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { RateChange } from "./rate-change";

afterEach(() => {
  cleanup();
});

describe("RateChange", () => {
  it("uses green and an up indicator for positive changes", () => {
    render(<RateChange direction="up" value="+0.14%" />);

    const change = screen.getByText("+0.14%").parentElement;

    expect(change?.className).toContain("text-green-500");
    expect(change?.textContent).toBe("▲\u00a0+0.14%");
  });

  it("uses red and a down indicator for negative changes", () => {
    render(<RateChange direction="down" value="-0.14%" />);

    const change = screen.getByText("-0.14%").parentElement;

    expect(change?.className).toContain("text-red-500");
    expect(change?.textContent).toBe("▼\u00a0-0.14%");
  });

  it("uses muted text and no indicator for neutral changes", () => {
    render(<RateChange direction="neutral" value="0.00%" />);

    const change = screen.getByText("0.00%").parentElement;

    expect(change?.className).toContain("text-neutral-200");
    expect(change?.textContent).toBe("0.00%");
  });
});
