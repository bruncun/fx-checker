import type { ReactNode } from "react";
import { LogoLink } from "@/components/logo-link";

type AppShellProps = {
  headerContent?: ReactNode;
  children?: ReactNode;
};

export function AppShell({ headerContent, children }: AppShellProps) {
  return (
    <main className="min-h-screen bg-neutral-900 text-white">
      <nav className="w-full flex justify-between items-center p-200 sm:px-300 sm:py-250">
        <LogoLink />
        {headerContent}
      </nav>
      {children}
    </main>
  );
}
