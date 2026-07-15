"use client";

import * as React from "react";

import { AppModal } from "@/components/ui/app-modal";
import type { ShortcutDefinition } from "./keyboard-shortcuts";

type KeyboardShortcutsDialogProps = {
  formatShortcut: (shortcut: ShortcutDefinition) => string;
  onClose: () => void;
};

function ShortcutKey({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex min-w-500 items-center justify-center rounded-4 px-125 py-075 text-preset-5 text-neutral-50 shadow-[inset_0_0_0_1px_hsl(var(--neutral-500))]">
      {children}
    </kbd>
  );
}

function KeyboardShortcutsDialog({ formatShortcut, onClose }: KeyboardShortcutsDialogProps) {
  return (
    <AppModal closeLabel="Close keyboard shortcuts" onClose={onClose} title="Keyboard Shortcuts">
      <section className="mt-300">
        <h3 className="text-preset-5-medium text-neutral-100 uppercase">Global</h3>
        <dl className="mt-150 grid grid-cols-[auto_1fr] items-center gap-x-200 gap-y-125">
          <ShortcutKey>{formatShortcut({ key: "K", modifier: "primary" })}</ShortcutKey>
          <dd className="text-preset-5 text-neutral-100">Focus currency search</dd>
          <ShortcutKey>{formatShortcut({ key: "X" })}</ShortcutKey>
          <dd className="text-preset-5 text-neutral-100">Swap currencies</dd>
          <ShortcutKey>{formatShortcut({ key: "/", modifier: "primary" })}</ShortcutKey>
          <dd className="text-preset-5 text-neutral-100">Show keyboard shortcuts</dd>
        </dl>
      </section>

      <section className="mt-300">
        <h3 className="text-preset-5-medium text-neutral-100 uppercase">History</h3>
        <dl className="mt-150 grid grid-cols-[auto_1fr] items-center gap-x-200 gap-y-125">
          <ShortcutKey>{formatShortcut({ key: "ArrowLeft" })}</ShortcutKey>
          <dd className="text-preset-5 text-neutral-100">Previous range</dd>
          <ShortcutKey>{formatShortcut({ key: "ArrowRight" })}</ShortcutKey>
          <dd className="text-preset-5 text-neutral-100">Next range</dd>
        </dl>
      </section>
    </AppModal>
  );
}

export { KeyboardShortcutsDialog };
