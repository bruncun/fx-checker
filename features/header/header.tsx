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
      <Logo />
      <ExchangeRateStats currencyCount={currencyCount} />
    </nav>
  );
}
