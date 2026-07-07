import { Logo } from "@/components/logo";
import { cn } from "@/lib/utils";
import Link from "next/link";
import type { ReactNode } from "react";

type AuthShellProps = {
  children: ReactNode;
  className?: string;
};

export function AuthShell({ children, className }: AuthShellProps) {
  return (
    <main className="flex min-h-svh w-full items-center justify-center bg-neutral-900 px-200 py-600 text-neutral-50 sm:px-300">
      <div className={cn("flex w-full max-w-[400px] flex-col items-center", className)}>
        <Link href="/" aria-label="Go to FX Checker home">
          <Logo className="mb-300" variant="mark" />
        </Link>
        <div className="w-full">{children}</div>
      </div>
    </main>
  );
}
