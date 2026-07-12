// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { KeyboardShortcutsProvider } from "@/features/keyboard-shortcuts";
import { RateHistoryRangePicker } from "./rate-history-range-viewer";

const { refresh, testSearchParams } = vi.hoisted(() => ({
  refresh: vi.fn(),
  testSearchParams: { current: "" },
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
  useRouter: () => ({ refresh }),
  useSearchParams: () => new URLSearchParams(testSearchParams.current),
}));

afterEach(() => {
  refresh.mockReset();
  testSearchParams.current = "";
  cleanup();
  vi.restoreAllMocks();
});

describe("RateHistoryRangePicker", () => {
  it("selects the clicked range, updates the URL, and refreshes the server tree", () => {
    const replaceState = vi.spyOn(window.history, "replaceState");

    render(<RateHistoryRangePicker selectedRange="1M" />);

    const nextRange = screen.getByRole("tab", { name: "3M" });

    fireEvent.click(nextRange);

    expect(nextRange.getAttribute("aria-selected")).toBe("true");
    expect(screen.getByRole("tab", { name: "1M" }).getAttribute("aria-selected")).toBe("false");
    expect(replaceState).toHaveBeenCalledWith(null, "", "/?range=3M");
    expect(refresh).toHaveBeenCalled();
  });

  it("preserves existing URL state when selecting a range", () => {
    const replaceState = vi.spyOn(window.history, "replaceState");

    testSearchParams.current = "from=GBP&to=JPY&range=1M";

    render(<RateHistoryRangePicker selectedRange="1M" />);

    fireEvent.click(screen.getByRole("tab", { name: "1Y" }));

    expect(replaceState).toHaveBeenCalledWith(null, "", "/?from=GBP&to=JPY&range=1Y");
  });

  it("moves to adjacent ranges with left and right shortcuts", () => {
    const replaceState = vi.spyOn(window.history, "replaceState");
    const { rerender } = render(
      <KeyboardShortcutsProvider>
        <RateHistoryRangePicker selectedRange="3M" />
      </KeyboardShortcutsProvider>
    );

    fireEvent.keyDown(window, { key: "ArrowLeft" });

    expect(replaceState).toHaveBeenCalledWith(null, "", "/?range=1M");

    rerender(
      <KeyboardShortcutsProvider>
        <RateHistoryRangePicker selectedRange="1M" />
      </KeyboardShortcutsProvider>
    );

    fireEvent.keyDown(window, { key: "ArrowRight" });

    expect(replaceState).toHaveBeenLastCalledWith(null, "", "/?range=3M");
  });

  it("preserves range picker roving focus while global history shortcuts are registered", () => {
    const replaceState = vi.spyOn(window.history, "replaceState");

    render(
      <KeyboardShortcutsProvider>
        <RateHistoryRangePicker selectedRange="1M" />
      </KeyboardShortcutsProvider>
    );

    const selectedRange = screen.getByRole("tab", { name: "1M" });

    selectedRange.focus();
    fireEvent.keyDown(selectedRange, { key: "ArrowRight" });

    const nextRange = screen.getByRole("tab", { name: "3M" });

    expect(document.activeElement).toBe(nextRange);
    expect(nextRange.getAttribute("aria-selected")).toBe("true");
    expect(replaceState).toHaveBeenCalledWith(null, "", "/?range=3M");
  });

  it("activates a roving-focused range with Enter", () => {
    const replaceState = vi.spyOn(window.history, "replaceState");

    render(
      <KeyboardShortcutsProvider>
        <RateHistoryRangePicker selectedRange="1M" />
      </KeyboardShortcutsProvider>
    );

    const selectedRange = screen.getByRole("tab", { name: "1M" });

    selectedRange.focus();
    fireEvent.keyDown(selectedRange, { key: "ArrowRight" });
    fireEvent.keyDown(screen.getByRole("tab", { name: "3M" }), { key: "Enter" });

    expect(replaceState).toHaveBeenCalledWith(null, "", "/?range=3M");
  });
});
