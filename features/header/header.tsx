import Link from "next/link";

import { Logo } from "@/components/logo";

type AppHeaderProps = {
  currencyCount: number;
};

function ExchangeRateStats({ currencyCount }: AppHeaderProps) {
  return (
    <ul
      className="flex items-center text-preset-6 text-neutral-200 uppercase sm:text-preset-4"
      aria-label="Exchange rate data stats"
    >
      <li>{currencyCount} Currencies</li>
      <li aria-hidden="true">&nbsp;·&nbsp;</li>
      <li>
        <abbr title="End of day">EOD</abbr>
      </li>
      <li aria-hidden="true">&nbsp;·&nbsp;</li>
      <li>
        <abbr title="European Central Bank">ECB</abbr> data
      </li>
    </ul>
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
