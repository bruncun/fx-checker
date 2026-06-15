import type { ReactNode } from "react";
import Link from "next/link";

import { Logo } from "@/components/logo";

type AppShellProps = {
  headerContent?: ReactNode;
  children?: ReactNode;
};

export function AppShell({ headerContent, children }: AppShellProps) {
  return (
    <main className="min-h-screen bg-neutral-900 text-white">
      <nav className="w-full flex justify-between items-center p-200 sm:px-300 sm:py-250">
        <Link href="/" aria-label="FX Checker">
          <Logo alt="" />
        </Link>
        {headerContent}
      </nav>
      {children}
    </main>
  );
}
