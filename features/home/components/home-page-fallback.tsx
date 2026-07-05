import { CurrencyButton } from "@/components/ui/currency-button";
import { ExchangeButton } from "@/components/ui/exchange-button";
import { FavoriteButton } from "@/components/ui/favorite-button";
import { InlineMetaList } from "@/components/ui/inline-meta-list";
import { LogConversionButton } from "@/components/ui/log-conversion-button";
import { cn } from "@/lib/utils";

function EmptySpace({ className }: { className: string }) {
  return <span aria-hidden className={cn("block", className)} />;
}

function FallbackAmountInput({ label }: { label: string }) {
  return (
    <input
      aria-label={`${label} amount`}
      className={cn(
        "field-sizing-content h-[40px] max-w-full min-w-0 border-b border-neutral-600 text-preset-1 text-neutral-50 caret-neutral-50 outline-none placeholder:text-neutral-200",
        "hover:border-neutral-200 focus-visible:-me-050 focus-visible:rounded-8 focus-visible:border-transparent focus-visible:bg-neutral-600 focus-visible:pe-050 focus-visible:caret-neutral-50 focus-visible:shadow-[0_0_0_2px_hsl(var(--neutral-600)),0_0_0_4px_hsl(var(--lime-500))] lg:h-[41px]"
      )}
      inputMode="decimal"
      readOnly
      tabIndex={-1}
      type="text"
      value=""
    />
  );
}

function HeaderStatsFallback() {
  return (
    <InlineMetaList
      className="flex items-center text-preset-6 text-neutral-200 uppercase sm:text-preset-4"
      aria-label="Exchange rate data stats"
      items={[
        <EmptySpace className="h-200 w-[88px] sm:h-250" key="currencies" />,
        <abbr key="eod" title="End of day">
          EOD
        </abbr>,
        <span key="ecb">
          <abbr title="European Central Bank">ECB</abbr>{" "}
          <span className="hidden sm:inline">data</span>
        </span>,
        <a
          className="rounded-4 text-neutral-50 underline-offset-4 hover:underline hover:decoration-neutral-200 focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-lime-500"
          href="/auth/login"
          key="sign-out"
        >
          Sign out
        </a>,
      ]}
    />
  );
}

function LiveRatesFallback() {
  return (
    <section className="relative flex w-full bg-neutral-700">
      <div
        className={cn(
          "flex shrink-0 items-center gap-100 bg-lime-500 px-100 py-150 text-preset-6 text-neutral-900 uppercase",
          "sm:h-500 sm:px-200 sm:text-preset-5-medium"
        )}
      >
        <span className="size-[6px] rounded-full bg-neutral-900" aria-hidden="true" />
        <span>Live markets</span>
      </div>
      <div
        className="min-w-0 flex-1 overflow-x-auto"
        role="region"
        aria-label="Live exchange rates"
      >
        <ul
          className="flex w-max divide-x divide-neutral-500 border-r border-neutral-500"
          aria-label="Live exchange rates"
        >
          {Array.from({ length: 6 }, (_, index) => (
            <li
              className="flex min-w-[148px] items-center gap-125 p-150 uppercase sm:h-500 sm:px-[12.5px] sm:py-[13px]"
              key={index}
            />
          ))}
        </ul>
      </div>
    </section>
  );
}

function ConverterFallback() {
  return (
    <section aria-labelledby="converter-heading">
      <h1 id="converter-heading" className="mb-200 text-preset-2 text-neutral-50 uppercase">
        Check the Rate
      </h1>
      <div className="rounded-20 bg-neutral-700 shadow-[0_12px_40px_0_rgb(0_0_0_/_0.4)]">
        <div className="flex flex-col gap-200 p-200 sm:flex-row sm:items-center sm:gap-300 sm:p-250">
          <ConverterAmountPanelFallback label="Send" />
          <ExchangeButton className="self-center" tabIndex={-1} />
          <ConverterAmountPanelFallback label="Receive" />
        </div>
        <svg width="100%" height="1">
          <line
            x1="0"
            y1="0"
            x2="100%"
            y2="0"
            className="stroke-neutral-500"
            strokeWidth="1"
            strokeDasharray="4 4"
          />
        </svg>
        <div className="min-h-[90px] p-200 sm:flex sm:min-h-800 sm:items-center sm:justify-between sm:px-250">
          <p
            className="text-center text-preset-6 text-neutral-50 sm:text-left sm:text-preset-5"
            aria-hidden
          >
            &nbsp;
          </p>
          <div className="mt-200 flex flex-wrap justify-center gap-100 sm:mt-0 sm:justify-end">
            <FavoriteButton aria-label="Favorite USD/EUR" tabIndex={-1} />
            <LogConversionButton aria-label="Log USD to EUR" disabled tabIndex={-1} />
          </div>
        </div>
      </div>
    </section>
  );
}

function ConverterAmountPanelFallback({ label }: { label: string }) {
  return (
    <section className="flex flex-col justify-between rounded-16 bg-neutral-600 p-200 shadow-[inset_0_0_0_1px_hsl(var(--neutral-500))] sm:min-w-0 sm:flex-1 sm:p-250">
      <h2 className="mb-250 text-preset-4 text-neutral-100 uppercase">{label}</h2>
      <div className="flex items-end justify-between gap-200">
        <FallbackAmountInput label={label} />
        <CurrencyButton
          aria-label={`Select ${label.toLowerCase()} currency`}
          countryCode={label === "Send" ? "us" : "eu"}
          currencyCode={label === "Send" ? "USD" : "EUR"}
          tabIndex={-1}
        />
      </div>
    </section>
  );
}

export { ConverterFallback, HeaderStatsFallback, LiveRatesFallback };
