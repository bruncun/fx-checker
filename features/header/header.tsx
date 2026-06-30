import Link from "next/link";

import { Logo } from "@/components/logo";
import { InlineMetaList } from "@/components/ui/inline-meta-list";

type AppHeaderProps = {
  currencyCount: number;
};

function ExchangeRateStats({ currencyCount }: AppHeaderProps) {
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
          <abbr title="European Central Bank">ECB</abbr> data
        </span>,
      ]}
    />
  );
}

export function Header({ currencyCount }: AppHeaderProps) {
  return (
    <nav className="flex w-full items-center justify-between p-200 sm:px-300 sm:py-250">
      <Link
        href="/"
        aria-label="FX Checker"
        className="rounded-8 focus-visible:shadow-[0_0_0_3px_hsl(var(--neutral-700)),0_0_0_4px_hsl(var(--lime-500))] focus-visible:outline-none"
      >
        <Logo alt="" />
      </Link>
      <ExchangeRateStats currencyCount={currencyCount} />
    </nav>
  );
}
