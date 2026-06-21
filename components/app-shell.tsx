import type { ReactNode } from "react";
import Link from "next/link";

import { Logo } from "@/components/logo";

type AppShellProps = {
  headerContent?: ReactNode;
  children?: ReactNode;
};

export function AppShell({ headerContent, children }: AppShellProps) {
  return (
    <main className="text-white min-h-screen bg-neutral-900">
      <nav className="flex w-full items-center justify-between p-200 sm:px-300 sm:py-250">
        <Link
          href="/"
          aria-label="FX Checker"
          className="rounded-8 focus-visible:shadow-[0_0_0_3px_hsl(var(--neutral-700)),0_0_0_4px_hsl(var(--lime-500))] focus-visible:outline-none"
        >
          <Logo alt="" />
        </Link>
        {headerContent}
      </nav>
      <div className="mx-auto max-w-[1100px] px-200 py-400 sm:px-300 sm:py-600">{children}</div>
    </main>
  );
}
