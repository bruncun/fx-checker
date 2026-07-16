"use client";

import * as React from "react";

import { ShortcutBadge } from "@/components/ui/shortcut-badge";
import { cn } from "@/lib/utils";

type ShortcutTooltipProps = {
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  label: string;
  shortcut: string;
};

function ShortcutTooltip({
  children,
  className,
  disabled = false,
  label,
  shortcut,
}: ShortcutTooltipProps) {
  return (
    <span className={cn("group/shortcut relative inline-flex", className)}>
      {children}
      {disabled ? null : (
        <span
          className={cn(
            "pointer-events-none absolute bottom-[calc(100%+8px)] left-1/2 z-[140] hidden -translate-x-1/2 rounded-4 bg-neutral-600 px-125 py-075 text-preset-6 whitespace-nowrap text-neutral-50 shadow-[inset_0_0_0_1px_hsl(var(--neutral-400)),var(--shadow-elevation-popover)]",
            "group-focus-within/shortcut:block group-hover/shortcut:block"
          )}
          role="tooltip"
        >
          <span>{label}</span>
          <ShortcutBadge aria-hidden="true" className="ml-125">
            {shortcut}
          </ShortcutBadge>
        </span>
      )}
    </span>
  );
}

export { ShortcutTooltip };
