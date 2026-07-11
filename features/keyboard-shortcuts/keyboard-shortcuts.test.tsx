// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
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

  return (
    <div aria-label="Live exchange rates" data-live-rates-scroll-region role="region" tabIndex={0}>
      Live rates
    </div>
  );
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

  it("lets focused live markets handle arrow-key scrolling while history shortcuts are registered", () => {
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

    const liveMarkets = screen.getByRole("region", { name: "Live exchange rates" });

    liveMarkets.focus();
    const wasNotCanceled = fireEvent.keyDown(liveMarkets, { key: "ArrowLeft" });

    expect(wasNotCanceled).toBe(true);
    expect(onPreviousRange).not.toHaveBeenCalled();
  });

  it("opens the keyboard shortcuts dialog as a modal and closes with the close button", async () => {
    const onFocusSearch = vi.fn();
    const onSwap = vi.fn();

    render(
      <KeyboardShortcutsProvider>
        <RegisteredActions onFocusSearch={onFocusSearch} onSwap={onSwap} />
        <button type="button">Invoker</button>
      </KeyboardShortcutsProvider>
    );

    screen.getByRole("button", { name: "Invoker" }).focus();
    fireEvent.keyDown(window, { key: "/", ...getPrimaryModifier() });

    expect(await screen.findByRole("dialog", { name: "Keyboard Shortcuts" })).toBeTruthy();
    expect(screen.getByText("Focus currency search")).toBeTruthy();
    expect(screen.getByText("Available while viewing the History tab.")).toBeTruthy();
    expect(document.activeElement).toBe(
      screen.getByRole("button", { name: "Close keyboard shortcuts" })
    );
    expect(document.body.style.overflow).toBe("hidden");
    expect(document.documentElement.style.overflow).toBe("hidden");

    fireEvent.keyDown(window, { key: "x" });
    fireEvent.keyDown(window, { key: "k", ...getPrimaryModifier() });

    expect(onSwap).not.toHaveBeenCalled();
    expect(onFocusSearch).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Close keyboard shortcuts" }));

    expect(screen.queryByRole("dialog", { name: "Keyboard Shortcuts" })).toBeNull();
    expect(document.body.style.overflow).toBe("");
    expect(document.documentElement.style.overflow).toBe("");
    await waitFor(() => {
      expect(document.activeElement).toBe(screen.getByRole("button", { name: "Invoker" }));
    });
  });

  it("traps focus and supports Escape and backdrop dismissal", async () => {
    render(
      <KeyboardShortcutsProvider>
        <button type="button">Invoker</button>
      </KeyboardShortcutsProvider>
    );

    screen.getByRole("button", { name: "Invoker" }).focus();
    fireEvent.keyDown(window, { key: "/", ...getPrimaryModifier() });

    const dialog = await screen.findByRole("dialog", { name: "Keyboard Shortcuts" });
    const closeButton = screen.getByRole("button", { name: "Close keyboard shortcuts" });

    fireEvent.keyDown(dialog, { key: "Tab" });
    expect(document.activeElement).toBe(closeButton);

    fireEvent.keyDown(dialog, { key: "Tab", shiftKey: true });
    expect(document.activeElement).toBe(closeButton);

    fireEvent.keyDown(dialog, { key: "Escape" });
    expect(screen.queryByRole("dialog", { name: "Keyboard Shortcuts" })).toBeNull();

    fireEvent.keyDown(window, { key: "/", ...getPrimaryModifier() });
    fireEvent.mouseDown(
      (await screen.findByRole("dialog", { name: "Keyboard Shortcuts" })).parentElement!
    );

    expect(screen.queryByRole("dialog", { name: "Keyboard Shortcuts" })).toBeNull();
  });
});
