// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { KeyboardShortcutsProvider, useKeyboardShortcuts } from ".";

function getPrimaryModifier() {
  return /Mac|iPhone|iPad|iPod/.test(navigator.platform) ? { metaKey: true } : { ctrlKey: true };
}

function RegisteredActions({
  onFocusSearch,
  onSwap,
}: {
  onFocusSearch: () => void;
  onSwap: () => void;
}) {
  const shortcuts = useKeyboardShortcuts();

  shortcuts.registerFocusCurrencySearch(onFocusSearch);
  shortcuts.registerSwapCurrencies(onSwap);

  return <input aria-label="Editable field" />;
}

function RegisteredHistoryRangeActions({
  onNextRange,
  onPreviousRange,
}: {
  onNextRange: () => void;
  onPreviousRange: () => void;
}) {
  const shortcuts = useKeyboardShortcuts();

  shortcuts.registerHistoryRangeNavigation({
    nextRange: onNextRange,
    previousRange: onPreviousRange,
  });

  return <div>History range shortcuts</div>;
}

afterEach(() => {
  document.body.style.overflow = "";
  document.documentElement.style.overflow = "";
  cleanup();
});

describe("KeyboardShortcutsProvider", () => {
  it("runs the focus search action with the primary K shortcut", () => {
    const onFocusSearch = vi.fn();

    render(
      <KeyboardShortcutsProvider>
        <RegisteredActions onFocusSearch={onFocusSearch} onSwap={vi.fn()} />
      </KeyboardShortcutsProvider>
    );

    fireEvent.keyDown(window, { key: "k", ...getPrimaryModifier() });

    expect(onFocusSearch).toHaveBeenCalledOnce();
  });

  it("runs the swap action with X unless editable content has focus", () => {
    const onSwap = vi.fn();

    render(
      <KeyboardShortcutsProvider>
        <RegisteredActions onFocusSearch={vi.fn()} onSwap={onSwap} />
      </KeyboardShortcutsProvider>
    );

    fireEvent.keyDown(window, { key: "x" });
    screen.getByRole("textbox", { name: "Editable field" }).focus();
    fireEvent.keyDown(screen.getByRole("textbox", { name: "Editable field" }), { key: "x" });

    expect(onSwap).toHaveBeenCalledOnce();
  });

  it("runs the registered history range arrow-key shortcuts", () => {
    const onNextRange = vi.fn();
    const onPreviousRange = vi.fn();

    render(
      <KeyboardShortcutsProvider>
        <RegisteredHistoryRangeActions
          onNextRange={onNextRange}
          onPreviousRange={onPreviousRange}
        />
      </KeyboardShortcutsProvider>
    );

    fireEvent.keyDown(window, { key: "ArrowRight" });
    expect(onNextRange).toHaveBeenCalledOnce();

    const wasNotCanceled = fireEvent.keyDown(window, { key: "ArrowLeft" });

    expect(wasNotCanceled).toBe(false);
    expect(onPreviousRange).toHaveBeenCalledOnce();
  });

  it("does not handle the former keyboard shortcuts dialog shortcut", () => {
    render(
      <KeyboardShortcutsProvider>
        <RegisteredActions onFocusSearch={vi.fn()} onSwap={vi.fn()} />
      </KeyboardShortcutsProvider>
    );

    expect(fireEvent.keyDown(window, { key: "/", ...getPrimaryModifier() })).toBe(true);
  });
});
