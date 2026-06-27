import * as React from "react";

import { cn } from "@/lib/utils";

export interface TabCountBadgeProps extends React.ComponentProps<"span"> {
  count: number;
}

function TabCountBadge({ className, count, ...props }: TabCountBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex size-[20px] shrink-0 items-center justify-center rounded-full bg-lime-800 text-preset-6 text-lime-500",
        className
      )}
      {...props}
    >
      {count}
    </span>
  );
}

export interface TabButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  count?: number;
  label: string;
}

function TabButton({
  active = false,
  className,
  count,
  label,
  role = "tab",
  type = "button",
  ...props
}: TabButtonProps) {
  return (
    <button
      aria-selected={active}
      className={cn(
        "inline-flex h-[42px] flex-col items-stretch text-preset-3 text-neutral-50 uppercase focus-visible:rounded-4 focus-visible:shadow-[0_0_0_2px_hsl(var(--neutral-900)),0_0_0_4px_hsl(var(--lime-500))] focus-visible:outline-none",
        className
      )}
      role={role}
      type={type}
      {...props}
    >
      <span className="inline-flex items-center gap-100 px-200 py-125">
        <span>{label}</span>
        {count !== undefined ? <TabCountBadge count={count} /> : null}
      </span>
      <span aria-hidden className={cn("h-025 bg-transparent", active && "bg-lime-500")} />
    </button>
  );
}

export { TabButton, TabCountBadge };
