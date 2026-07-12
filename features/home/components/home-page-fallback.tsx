import { ExchangeButton } from "@/components/ui/exchange-button";
import { Icon } from "@/components/ui/icon";
import { InlineMetaList } from "@/components/ui/inline-meta-list";
import { interactiveSurfaceClassName } from "@/components/ui/interactive-surface";
import { LogConversionButton } from "@/components/ui/log-conversion-button";
import { FavoriteButtonFallback } from "@/features/converter";
import { cn } from "@/lib/utils";

function SkeletonBlock({ className }: { className: string }) {
  return <span aria-hidden className={cn("fx-skeleton block", className)} />;
}

function FallbackAmountInput({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "fx-skeleton h-[40px] w-[112px] max-w-[42vw] rounded-6 sm:w-[132px] lg:h-[41px]",
        className
      )}
    />
  );
}

function FallbackCurrencyButton({ label }: { label: string }) {
  return (
    <button
      aria-label={`Loading ${label.toLowerCase()} currency`}
      className={cn(
        interactiveSurfaceClassName,
        "h-500 w-1200 p-125 text-preset-4 text-neutral-50 uppercase"
      )}
      disabled
      tabIndex={-1}
      type="button"
    >
      <span aria-hidden="true" className="fx-skeleton fx-skeleton-control size-250 rounded-full" />
      <span
        aria-hidden="true"
        className="fx-skeleton fx-skeleton-control inline-block h-[17px] w-[28px] rounded-4"
      />
      <Icon decorative iconName="chevron-down" />
    </button>
  );
}

function HeaderStatsFallback() {
  return (
    <InlineMetaList
      className="flex items-center text-preset-6 text-neutral-200 uppercase sm:text-preset-4"
      aria-label="Exchange rate data stats"
      items={[
        <SkeletonBlock className="h-200 w-[88px] rounded-4 sm:h-250" key="currencies" />,
        <abbr key="eod" title="End of day">
          EOD
        </abbr>,
        {
          className: "hidden sm:list-item",
          content: "Central bank data",
        },
        <span
          aria-hidden="true"
          className="fx-skeleton inline-flex size-400 shrink-0 rounded-full shadow-[inset_0_0_0_1px_hsl(var(--neutral-400))]"
          key="account"
        />,
      ]}
    />
  );
}

function LiveRatesFallback() {
  return (
    <aside
      aria-labelledby="market-snapshot-fallback-heading"
      className="relative flex w-full bg-neutral-700"
    >
      <div
        className={cn(
          "flex shrink-0 items-center gap-100 bg-lime-500 px-100 py-150 text-preset-6 text-neutral-900 uppercase",
          "sm:h-500 sm:px-200 sm:text-preset-5-medium"
        )}
      >
        <span className="size-[6px] rounded-full bg-neutral-900" aria-hidden="true" />
        <span id="market-snapshot-fallback-heading">Market snapshot</span>
      </div>
      <div
        className="min-w-0 flex-1 overflow-x-auto"
        role="region"
        aria-label="Market snapshot exchange rates"
      >
        <ul
          className="flex w-max divide-x divide-neutral-500 border-r border-neutral-500"
          aria-label="Market snapshot exchange rates"
        >
          {Array.from({ length: 6 }, (_, index) => (
            <li
              className="flex min-w-[148px] items-center gap-125 p-150 uppercase sm:h-500 sm:px-[12.5px] sm:py-[13px]"
              key={index}
            />
          ))}
        </ul>
      </div>
    </aside>
  );
}

function ConverterFallback() {
  return (
    <section aria-busy="true" aria-labelledby="converter-heading">
      <h1 id="converter-heading" className="mb-200 text-preset-2 text-neutral-50 uppercase">
        Check the Rate
      </h1>
      <div className="rounded-20 bg-neutral-700 shadow-[var(--shadow-elevation-card)]">
        <div className="flex flex-col gap-200 p-200 sm:flex-row sm:items-center sm:gap-300 sm:p-250">
          <ConverterAmountPanelFallback label="Send" />
          <ExchangeButton className="self-center" tabIndex={-1} />
          <ConverterAmountPanelFallback className="text-lime-500" label="Receive" />
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
            aria-label="Loading exchange rate"
            className="flex min-h-[10px] justify-center sm:justify-start"
          >
            <SkeletonBlock className="h-[10px] w-[108px] max-w-full rounded-4 sm:h-200 sm:w-[139px]" />
          </p>
          <div className="mt-200 flex flex-wrap justify-center gap-100 sm:mt-0 sm:justify-end">
            <FavoriteButtonFallback />
            <LogConversionButton aria-label="Log conversion" tabIndex={-1} />
          </div>
        </div>
      </div>
    </section>
  );
}

function ConverterAmountPanelFallback({ className, label }: { className?: string; label: string }) {
  return (
    <section className="flex flex-col justify-between rounded-16 bg-neutral-600 p-200 shadow-[inset_0_0_0_1px_hsl(var(--neutral-500))] sm:min-w-0 sm:flex-1 sm:p-250">
      <h2 className="mb-250 text-preset-4 text-neutral-100 uppercase">{label}</h2>
      <div className="flex items-end justify-between gap-200">
        <FallbackAmountInput className={className} />
        <FallbackCurrencyButton label={label} />
      </div>
    </section>
  );
}

export { ConverterFallback, HeaderStatsFallback, LiveRatesFallback };
