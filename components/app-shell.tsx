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
        <Link href="/" aria-label="FX Checker">
          <Logo alt="" />
        </Link>
        {headerContent}
      </nav>
      <div className="mx-auto max-w-[1100px] px-200 py-400 sm:px-300 sm:py-600">{children}</div>
    </main>
  );
}
