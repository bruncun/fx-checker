import * as React from "react";
import Link, { type LinkProps } from "next/link";

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

export type TabButtonProps = {
  active?: boolean;
  count?: number;
  label: string;
} & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, keyof LinkProps | "href"> &
  LinkProps & {
    href: LinkProps["href"];
  };

function getTabButtonContent({
  active,
  count,
  label,
}: {
  active: boolean;
  count?: number;
  label: string;
}) {
  return (
    <>
      <span className="inline-flex items-center gap-100 px-200 py-125">
        <span>{label}</span>
        {count !== undefined ? <TabCountBadge count={count} /> : null}
      </span>
      <span aria-hidden className={cn("h-025 bg-transparent", active && "bg-lime-500")} />
    </>
  );
}

function getTabButtonClassName(className: string | undefined) {
  return cn(
    "inline-flex h-[42px] flex-col items-stretch text-preset-3 text-neutral-50 uppercase focus-visible:rounded-4 focus-visible:shadow-[0_0_0_2px_hsl(var(--neutral-900)),0_0_0_4px_hsl(var(--lime-500))] focus-visible:outline-none",
    className
  );
}

function TabButton({
  active = false,
  className,
  count,
  href,
  label,
  role = "tab",
  ...props
}: TabButtonProps) {
  return (
    <Link
      aria-selected={active}
      className={getTabButtonClassName(className)}
      href={href}
      role={role}
      {...props}
      prefetch
    >
      {getTabButtonContent({ active, count, label })}
    </Link>
  );
}

export { TabButton, TabCountBadge };
