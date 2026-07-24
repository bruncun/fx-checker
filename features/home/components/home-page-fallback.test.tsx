// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { HeaderStatsFallback, LiveRatesFallback } from "./home-page-fallback";

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

describe("LiveRatesFallback", () => {
  it("keeps the market snapshot landmark and compact playback footprint while rates load", () => {
    render(<LiveRatesFallback />);

    const snapshot = screen.getByRole("complementary", { name: "Market snapshot" });
    const ratesList = screen.getByRole("list", { name: "Exchange rates" });
    const viewport = ratesList.parentElement;
    const controlPlaceholder =
      screen.getByText("Market snapshot").parentElement?.nextElementSibling;

    expect(snapshot.contains(ratesList)).toBe(true);
    expect(viewport?.classList.contains("overflow-x-clip")).toBe(true);
    expect(viewport?.getAttribute("tabindex")).toBeNull();
    expect(screen.queryByRole("button")).toBeNull();
    expect(controlPlaceholder?.getAttribute("aria-hidden")).toBe("true");
    expect(controlPlaceholder?.nextElementSibling).toBe(viewport);
  });
});
