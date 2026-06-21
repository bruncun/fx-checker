import { DeployButton } from "@/components/deploy-button";
import { EnvVarWarning } from "@/components/env-var-warning";
import { AuthButton } from "@/components/auth-button";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { hasEnvVars } from "@/lib/utils";
import Link from "next/link";
import { Suspense } from "react";

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen flex-col items-center">
      <div className="gap-20 flex w-full flex-1 flex-col items-center">
        <nav className="h-16 flex w-full justify-center border-b border-b-foreground/10">
          <div className="p-3 px-5 text-sm flex w-full max-w-5xl items-center justify-between">
            <div className="gap-5 flex items-center font-semibold">
              <Link href={"/"}>Next.js Supabase Starter</Link>
              <div className="gap-2 flex items-center">
                <DeployButton />
              </div>
            </div>
            {!hasEnvVars ? (
              <EnvVarWarning />
            ) : (
              <Suspense>
                <AuthButton />
              </Suspense>
            )}
          </div>
        </nav>
        <div className="gap-20 p-5 flex max-w-5xl flex-1 flex-col">{children}</div>

        <footer className="text-xs gap-8 py-16 mx-auto flex w-full items-center justify-center border-t text-center">
          <p>
            Powered by{" "}
            <a
              href="https://supabase.com/?utm_source=create-next-app&utm_medium=template&utm_term=nextjs"
              target="_blank"
              className="font-bold hover:underline"
              rel="noreferrer"
            >
              Supabase
            </a>
          </p>
          <ThemeSwitcher />
        </footer>
      </div>
    </main>
  );
}
