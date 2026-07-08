import { Logo } from "@/components/logo";
import { InlineMetaList } from "@/components/ui/inline-meta-list";
import { isGuestModeFromCookies } from "@/features/guest-session/guest-session";
import { createClient } from "@/lib/supabase/server";
import { hasEnvVars } from "@/lib/utils";
import { cookies } from "next/headers";
import type { ReactNode } from "react";
import { UserDropdown } from "./user-dropdown";

type ExchangeRateStatsProps = {
  currencyCount: number;
  email?: string | null;
  isGuest?: boolean;
};

type ExchangeRateDataStatsProps = {
  currencyCount: number;
};

type HeaderProps = {
  statsSlot?: ReactNode;
};

async function getHeaderAccount() {
  const cookieStore = await cookies();
  const isGuest = isGuestModeFromCookies(cookieStore);

  if (isGuest || !hasEnvVars || process.env.FX_CHECKER_E2E_AUTH_BYPASS === "1") {
    return { email: null, isGuest: true };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error) {
    return { email: null, isGuest: false };
  }

  return { email: data.user?.email ?? null, isGuest: false };
}

function AccountFallback() {
  return (
    <span
      aria-hidden="true"
      className="inline-flex size-400 shrink-0 items-center justify-center rounded-full bg-neutral-500 text-preset-6 text-neutral-50 shadow-[inset_0_0_0_1px_hsl(var(--neutral-400))]"
    >
      &nbsp;
    </span>
  );
}

function ExchangeRateDataStats({ currencyCount }: ExchangeRateDataStatsProps) {
  return (
    <InlineMetaList
      className="flex items-center text-preset-6 text-neutral-200 uppercase sm:text-preset-4"
      aria-label="Exchange rate data stats"
      items={[
        `${currencyCount} Currencies`,
        <abbr key="eod" title="End of day">
          EOD
        </abbr>,
        <span key="ecb">
          <abbr title="European Central Bank">ECB</abbr>{" "}
          <span className="hidden sm:inline">data</span>
        </span>,
      ]}
    />
  );
}

function ExchangeRateStats({ currencyCount, email, isGuest = false }: ExchangeRateStatsProps) {
  return (
    <div className="flex items-center gap-200">
      <ExchangeRateDataStats currencyCount={currencyCount} />
      <UserDropdown email={email} isGuest={isGuest} />
    </div>
  );
}

export function Header({ statsSlot }: HeaderProps) {
  return (
    <nav className="relative z-[80] flex w-full items-center justify-between p-200 sm:px-300 sm:py-[17px]">
      <Logo />
      {statsSlot}
    </nav>
  );
}

export { AccountFallback, ExchangeRateDataStats, ExchangeRateStats, getHeaderAccount };
