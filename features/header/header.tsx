import { Logo } from "@/components/logo";
import { InlineMetaList } from "@/components/ui/inline-meta-list";
import type { ReactNode } from "react";
import { SignOutLink } from "./sign-out-link";

type ExchangeRateStatsProps = {
  currencyCount: number;
};

type HeaderProps = {
  statsSlot?: ReactNode;
};

function ExchangeRateStats({ currencyCount }: ExchangeRateStatsProps) {
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
        <SignOutLink key="sign-out" />,
      ]}
    />
  );
}

export function Header({ statsSlot }: HeaderProps) {
  return (
    <nav className="flex w-full items-center justify-between p-200 sm:px-300 sm:py-250">
      <Logo />
      {statsSlot}
    </nav>
  );
}

export { ExchangeRateStats };
