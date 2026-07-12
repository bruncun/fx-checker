// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { KeyboardShortcutsProvider } from "@/features/keyboard-shortcuts";
import { RateHistoryRangePicker } from "./rate-history-range-viewer";

const { replace, testSearchParams } = vi.hoisted(() => ({
  replace: vi.fn(),
  testSearchParams: { current: "" },
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
  useRouter: () => ({ replace }),
  useSearchParams: () => new URLSearchParams(testSearchParams.current),
}));

afterEach(() => {
  replace.mockReset();
  testSearchParams.current = "";
  cleanup();
  vi.restoreAllMocks();
});

describe("RateHistoryRangePicker", () => {
  it("selects the clicked range and navigates without scrolling", () => {
    render(<RateHistoryRangePicker selectedRange="1M" />);

    const nextRange = screen.getByRole("radio", { name: "3M" });

    fireEvent.click(nextRange);

    expect(nextRange.getAttribute("aria-checked")).toBe("true");
    expect(screen.getByRole("radio", { name: "1M" }).getAttribute("aria-checked")).toBe("false");
    expect(replace).toHaveBeenCalledWith("/?range=3M", { scroll: false });
  });

  it("preserves existing URL state when selecting a range", () => {
    testSearchParams.current = "from=GBP&to=JPY&range=1M";

    render(<RateHistoryRangePicker selectedRange="1M" />);

    fireEvent.click(screen.getByRole("radio", { name: "1Y" }));

    expect(replace).toHaveBeenCalledWith("/?from=GBP&to=JPY&range=1Y", { scroll: false });
  });

  it("moves to adjacent ranges with left and right shortcuts", () => {
    const { rerender } = render(
      <KeyboardShortcutsProvider>
        <RateHistoryRangePicker selectedRange="3M" />
      </KeyboardShortcutsProvider>
    );

    fireEvent.keyDown(window, { key: "ArrowLeft" });

    expect(replace).toHaveBeenCalledWith("/?range=1M", { scroll: false });

    rerender(
      <KeyboardShortcutsProvider>
        <RateHistoryRangePicker selectedRange="1M" />
      </KeyboardShortcutsProvider>
    );

    fireEvent.keyDown(window, { key: "ArrowRight" });

    expect(replace).toHaveBeenLastCalledWith("/?range=3M", { scroll: false });
  });

  it("preserves range picker roving focus while global history shortcuts are registered", () => {
    render(
      <KeyboardShortcutsProvider>
        <RateHistoryRangePicker selectedRange="1M" />
      </KeyboardShortcutsProvider>
    );

    const selectedRange = screen.getByRole("radio", { name: "1M" });

    selectedRange.focus();
    fireEvent.keyDown(selectedRange, { key: "ArrowRight" });

    const nextRange = screen.getByRole("radio", { name: "3M" });

    expect(document.activeElement).toBe(nextRange);
    expect(nextRange.getAttribute("aria-checked")).toBe("true");
    expect(replace).toHaveBeenCalledWith("/?range=3M", { scroll: false });
  });

  it("activates a roving-focused range with Enter", () => {
    render(
      <KeyboardShortcutsProvider>
        <RateHistoryRangePicker selectedRange="1M" />
      </KeyboardShortcutsProvider>
    );

    const selectedRange = screen.getByRole("radio", { name: "1M" });

    selectedRange.focus();
    fireEvent.keyDown(selectedRange, { key: "ArrowRight" });
    fireEvent.keyDown(screen.getByRole("radio", { name: "3M" }), { key: "Enter" });

    expect(replace).toHaveBeenCalledWith("/?range=3M", { scroll: false });
  });
});
