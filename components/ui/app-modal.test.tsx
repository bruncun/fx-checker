// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import * as React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AppModal } from "./app-modal";

afterEach(() => {
  document.body.style.overflow = "";
  document.documentElement.style.overflow = "";
  cleanup();
});

describe("AppModal", () => {
  it("focuses the close button, traps focus, locks scroll, and restores focus", async () => {
    const onClose = vi.fn();

    render(
      <>
        <button type="button">Invoker</button>
        <AppModal closeLabel="Close modal" onClose={onClose} title="Modal title">
          <button type="button">Modal action</button>
        </AppModal>
      </>
    );

    const closeButton = screen.getByRole("button", { name: "Close modal" });
    const actionButton = screen.getByRole("button", { name: "Modal action" });
    const dialog = screen.getByRole("dialog", { name: "Modal title" });

    expect(document.activeElement).toBe(closeButton);
    expect(document.body.style.overflow).toBe("hidden");
    expect(document.documentElement.style.overflow).toBe("hidden");

    fireEvent.keyDown(dialog, { key: "Tab" });
    expect(document.activeElement).toBe(actionButton);

    fireEvent.keyDown(dialog, { key: "Tab" });
    expect(document.activeElement).toBe(closeButton);

    fireEvent.keyDown(dialog, { key: "Tab", shiftKey: true });
    expect(document.activeElement).toBe(actionButton);

    fireEvent.keyDown(dialog, { key: "Escape" });
    expect(onClose).toHaveBeenCalledOnce();

    cleanup();
    expect(document.body.style.overflow).toBe("");
    expect(document.documentElement.style.overflow).toBe("");
  });

  it("supports backdrop and close-button dismissal", () => {
    const onClose = vi.fn();

    render(
      <AppModal closeLabel="Close modal" onClose={onClose} title="Modal title">
        Content
      </AppModal>
    );

    fireEvent.mouseDown(screen.getByRole("dialog", { name: "Modal title" }).parentElement!);
    expect(onClose).toHaveBeenCalledOnce();

    fireEvent.click(screen.getByRole("button", { name: "Close modal" }));
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it("returns focus to the invoker after dismissal", async () => {
    function TestModal() {
      const [isOpen, setIsOpen] = React.useState(false);

      return (
        <>
          <button type="button" onClick={() => setIsOpen(true)}>
            Invoker
          </button>
          {isOpen ? (
            <AppModal closeLabel="Close modal" onClose={() => setIsOpen(false)} title="Modal title">
              Content
            </AppModal>
          ) : null}
        </>
      );
    }

    render(<TestModal />);

    const invoker = screen.getByRole("button", { name: "Invoker" });
    invoker.focus();
    fireEvent.click(invoker);
    fireEvent.click(screen.getByRole("button", { name: "Close modal" }));

    await waitFor(() => {
      expect(document.activeElement).toBe(invoker);
    });
  });

  it("can move initial focus to the first focusable child", async () => {
    const onClose = vi.fn();

    render(
      <>
        <button type="button">Invoker</button>
        <AppModal
          closeLabel="Close modal"
          initialFocus="first"
          onClose={onClose}
          title="Modal title"
        >
          <button type="button">Modal action</button>
        </AppModal>
      </>
    );

    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Modal action" }));

    cleanup();
  });
});
