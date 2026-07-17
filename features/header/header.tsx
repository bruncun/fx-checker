import { Logo } from "@/components/logo";
import { InlineMetaList } from "@/components/ui/inline-meta-list";
import { isGuestModeFromCookies } from "@/features/guest-session/model/guest-session";
import { hasEnvVars } from "@/lib/env";
import { cookies } from "next/headers";
import type { ReactNode } from "react";

type ExchangeRateDataStatsProps = {
  currencyCount: number;
};

type HeaderProps = {
  statsSlot?: ReactNode;
};

async function getHeaderIsGuest() {
  const cookieStore = await cookies();
  return (
    isGuestModeFromCookies(cookieStore) ||
    !hasEnvVars ||
    process.env.FX_CHECKER_E2E_AUTH_BYPASS === "1"
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
        {
          className: "hidden sm:list-item",
          content: "Central bank data",
        },
      ]}
    />
  );
}

export function Header({ statsSlot }: HeaderProps) {
  return (
    <header className="relative z-[80] flex w-full items-center justify-between px-200 py-150 py-[10px] sm:px-300 sm:py-[17px]">
      <Logo />
      {statsSlot}
    </header>
  );
}

export { ExchangeRateDataStats, getHeaderIsGuest };
