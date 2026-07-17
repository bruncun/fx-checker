// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { HeaderStatsFallback } from "./home-page-fallback";

afterEach(() => {
  cleanup();
});

describe("HeaderStatsFallback", () => {
  it("reserves the streamed header stat and account trigger sizes", () => {
    const { container } = render(<HeaderStatsFallback />);

    const stats = screen.getByLabelText("Exchange rate data stats");
    const currencyFallback = stats.querySelector(".fx-skeleton > .text-transparent");
    const accountFallback = container.querySelector(".fx-skeleton.w-\\[50px\\]");
    const divider = container.querySelector(".h-300.w-px.shrink-0.bg-neutral-500");

    expect(currencyFallback?.textContent).toBe("31 Currencies");
    expect(stats.contains(accountFallback)).toBe(false);
    expect(divider?.nextElementSibling).toBe(accountFallback);
    expect(accountFallback?.className).toContain("sm:w-[105px]");
    expect(accountFallback?.className).toContain("lg:w-[114px]");
  });
});
