import { ExchangeButton } from "@/components/ui/exchange-button";
import { Icon } from "@/components/ui/icon";
import { InlineMetaList } from "@/components/ui/inline-meta-list";
import { interactiveSurfaceClassName } from "@/components/ui/interactive-surface";
import { LogConversionButton } from "@/components/ui/log-conversion-button";
import { FavoriteButtonFallback } from "@/features/converter/components/converter-amount-controls";
import { UserDropdown } from "@/features/header/user-dropdown";
import { cx } from "@/lib/cx";
import type { ReactNode } from "react";

function SkeletonBlock({ className }: { className: string }) {
  return <span aria-hidden className={cx("fx-skeleton block", className)} />;
}

function SkeletonText({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span aria-hidden="true" className={cx("fx-skeleton inline-block rounded-4", className)}>
      <span className="text-transparent" style={{ visibility: "hidden" }}>
        {children}
      </span>
    </span>
  );
}

function FallbackAmountInput({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cx(
        "fx-skeleton h-[40px] w-[112px] max-w-[42vw] rounded-6 sm:w-[132px] lg:h-[41px]",
        className
      )}
    />
  );
}

function FallbackCurrencyButton() {
  return (
    <button
      aria-label="Loading currency"
      className={cx(
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
    <div className="flex items-center gap-200">
      <InlineMetaList
        className="flex items-center text-preset-6 text-neutral-200 uppercase sm:text-preset-4"
        aria-label="Exchange rate data stats"
        items={[
          <SkeletonText key="currencies">31 Currencies</SkeletonText>,
          <abbr key="eod" title="End of day">
            EOD
          </abbr>,
          {
            className: "hidden sm:list-item",
            content: "Central bank data",
          },
        ]}
      />
      <span aria-hidden="true" className="h-300 w-px shrink-0 bg-neutral-500" />
      <UserDropdown isGuest />
    </div>
  );
}

const liveRateFallbackItems = [
  { pair: "EUR/USD", rate: "1.1723", change: "-0.14%" },
  { pair: "USD/JPY", rate: "157.91", change: "+0.04%" },
  { pair: "GBP/USD", rate: "1.3575", change: "-0.22%" },
  { pair: "USD/CHF", rate: "0.9098", change: "+0.13%" },
  { pair: "EUR/GBP", rate: "0.8633", change: "+0.11%" },
  { pair: "AUD/USD", rate: "0.7208", change: "+0.08%" },
  { pair: "USD/CAD", rate: "1.3815", change: "+0.04%" },
] as const;

function LiveRateFallbackText({ children, className }: { children: ReactNode; className: string }) {
  return (
    <span aria-hidden="true" className={cx("fx-skeleton inline-block rounded-4", className)}>
      <span className="text-transparent" style={{ visibility: "hidden" }}>
        {children}
      </span>
    </span>
  );
}

function LiveRateChangeFallback({ value }: { value: string }) {
  return (
    <span
      aria-hidden="true"
      className={cx(
        "fx-skeleton inline-flex items-center rounded-4 text-transparent",
        "text-preset-6 sm:text-preset-5 [&>span:first-child]:w-075 [&>span:first-child]:text-[6.5px] sm:[&>span:first-child]:w-100 sm:[&>span:first-child]:text-[8.5px]"
      )}
    >
      <span className="inline-flex justify-center leading-none" style={{ visibility: "hidden" }}>
        ▲&nbsp;
      </span>
      <span style={{ visibility: "hidden" }}>{value}</span>
    </span>
  );
}

function LiveRatesFallback() {
  return (
    <aside aria-labelledby="Market snapshot" className="relative flex w-full bg-neutral-700">
      <div
        className={cx(
          "flex shrink-0 items-center gap-100 bg-lime-500 px-100 py-150 text-preset-6 text-neutral-900 uppercase",
          "sm:h-500 sm:px-200 sm:text-preset-5-medium"
        )}
      >
        <span id="market-snapshot-fallback-heading">Market snapshot</span>
      </div>
      <div className="min-w-0 flex-1 overflow-x-auto" role="region">
        <ul
          className="flex w-max divide-x divide-neutral-500 border-r border-neutral-500"
          aria-label="Exchange rates"
        >
          {liveRateFallbackItems.map((item) => (
            <li
              className="flex items-center gap-125 p-150 uppercase sm:h-500 sm:px-[12.5px] sm:py-[13px]"
              key={item.pair}
            >
              <LiveRateFallbackText className="text-preset-6 sm:text-preset-5">
                {item.pair}
              </LiveRateFallbackText>
              <LiveRateFallbackText className="text-preset-6 sm:text-preset-5-medium">
                {item.rate}
              </LiveRateFallbackText>
              <LiveRateChangeFallback value={item.change} />
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}

function ConverterFallback() {
  return (
    <div aria-busy="true">
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
    </div>
  );
}

function ConverterAmountPanelFallback({ className, label }: { className?: string; label: string }) {
  return (
    <fieldset className="m-0 flex min-w-0 flex-col justify-between rounded-16 border-0 bg-neutral-600 p-200 shadow-[inset_0_0_0_1px_hsl(var(--neutral-500))] [min-inline-size:0] sm:flex-1 sm:p-250">
      <legend className="sr-only">{label}</legend>
      <span aria-hidden="true" className="mb-250 text-preset-4 text-neutral-100 uppercase">
        {label}
      </span>
      <div className="flex items-end justify-between gap-200">
        <FallbackAmountInput className={className} />
        <FallbackCurrencyButton />
      </div>
    </fieldset>
  );
}

export { ConverterFallback, HeaderStatsFallback, LiveRatesFallback };
