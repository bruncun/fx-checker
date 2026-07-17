// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { HeaderStatsFallback } from "./home-page-fallback";

vi.mock("next-themes", () => ({
  useTheme: () => ({ setTheme: vi.fn(), theme: "system" }),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn(), replace: vi.fn() }),
}));

afterEach(() => {
  cleanup();
});

describe("HeaderStatsFallback", () => {
  it("renders the static account trigger with the streamed header stat fallback", () => {
    const { container } = render(<HeaderStatsFallback />);

    const stats = screen.getByLabelText("Exchange rate data stats");
    const currencyFallback = stats.querySelector(".fx-skeleton > .text-transparent");
    const accountTrigger = screen.getByRole("button", { name: "Account menu" });
    const divider = container.querySelector(".h-300.w-px.shrink-0.bg-neutral-500");

    expect(currencyFallback?.textContent).toBe("31 Currencies");
    expect(stats.contains(accountTrigger)).toBe(false);
    expect(divider?.nextElementSibling).toBe(accountTrigger.parentElement);
    expect(accountTrigger.textContent).toBe("Account");
  });
});
