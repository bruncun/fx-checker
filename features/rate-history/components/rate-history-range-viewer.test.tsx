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
});

describe("RateHistoryRangePicker", () => {
  it("selects the clicked range and navigates without scrolling", () => {
    render(<RateHistoryRangePicker selectedRange="1M" />);

    fireEvent.click(screen.getByRole("tab", { name: "3M" }));

    expect(screen.getByRole("tab", { name: "3M" }).getAttribute("aria-selected")).toBe("true");
    expect(screen.getByRole("tab", { name: "1M" }).getAttribute("aria-selected")).toBe("false");
    expect(replace).toHaveBeenCalledWith("/?range=3M", { scroll: false });
  });

  it("preserves existing URL state when selecting a new range", () => {
    testSearchParams.current = "from=GBP&to=JPY&range=1M";

    render(<RateHistoryRangePicker selectedRange="1M" />);

    fireEvent.click(screen.getByRole("tab", { name: "1Y" }));

    expect(replace).toHaveBeenCalledWith("/?from=GBP&to=JPY&range=1Y", { scroll: false });
  });

  it("moves to adjacent ranges with left and right shortcuts", () => {
    render(
      <KeyboardShortcutsProvider>
        <RateHistoryRangePicker selectedRange="3M" />
      </KeyboardShortcutsProvider>
    );

    fireEvent.keyDown(window, { key: "ArrowLeft" });

    expect(screen.getByRole("tab", { name: "1M" }).getAttribute("aria-selected")).toBe("true");
    expect(replace).toHaveBeenLastCalledWith("/?range=1M", { scroll: false });

    fireEvent.keyDown(window, { key: "ArrowRight" });

    expect(screen.getByRole("tab", { name: "3M" }).getAttribute("aria-selected")).toBe("true");
    expect(replace).toHaveBeenLastCalledWith("/?range=3M", { scroll: false });
  });

  it("preserves range picker roving focus while global history shortcuts are registered", () => {
    render(
      <KeyboardShortcutsProvider>
        <RateHistoryRangePicker selectedRange="1M" />
      </KeyboardShortcutsProvider>
    );

    const selectedRange = screen.getByRole("tab", { name: "1M" });

    selectedRange.focus();
    fireEvent.keyDown(selectedRange, { key: "ArrowRight" });

    const nextRange = screen.getByRole("tab", { name: "3M" });

    expect(nextRange.getAttribute("aria-selected")).toBe("true");
    expect(document.activeElement).toBe(nextRange);
    expect(replace).toHaveBeenCalledTimes(1);
    expect(replace).toHaveBeenCalledWith("/?range=3M", { scroll: false });
  });

  it("activates a roving-focused range with Enter", () => {
    render(
      <KeyboardShortcutsProvider>
        <RateHistoryRangePicker selectedRange="1M" />
      </KeyboardShortcutsProvider>
    );

    const selectedRange = screen.getByRole("tab", { name: "1M" });

    selectedRange.focus();
    fireEvent.keyDown(selectedRange, { key: "ArrowRight" });
    fireEvent.keyDown(screen.getByRole("tab", { name: "3M" }), { key: "Enter" });

    expect(replace).toHaveBeenCalledWith("/?range=3M", { scroll: false });
  });
});
