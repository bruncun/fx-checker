import { Icon } from "@/components/ui/icon";
import { TabButton } from "@/components/ui/tab-button";
import { cn } from "@/lib/utils";
import { rateDetailsSectionDefinitions } from "./rate-details-navigation-state";

const fallbackHistoryRanges = ["1D", "1W", "1M", "3M", "1Y", "5Y"];
const fallbackSelectedHistoryRange = "1M";

function EmptyBox({ className }: { className: string }) {
  return <span aria-hidden className={cn("block", className)} />;
}

function RateHistoryFallback() {
  return (
    <section aria-label="Rate history" className="uppercase">
      <div className="lg:flex lg:items-center lg:justify-between lg:gap-400">
        <div className="grid grid-cols-2 gap-125 sm:inline-grid sm:grid-cols-4 sm:gap-200">
          {["Open", "Last", "Change", "% Change"].map((label) => (
            <article
              className="rounded-16 bg-neutral-700 px-250 py-150 shadow-[inset_0_0_0_1px_hsl(var(--neutral-600))] sm:min-w-[140px]"
              key={label}
            >
              <p className="text-preset-4 text-neutral-50/70">{label}</p>
              <EmptyBox className="mt-200 h-300" />
            </article>
          ))}
        </div>
        <RangePickerFallback />
      </div>
      <div className="mt-200 min-h-[369px] rounded-16 bg-neutral-700 p-200 shadow-[inset_0_0_0_1px_hsl(var(--neutral-600))] sm:mt-250" />
    </section>
  );
}

function RangePickerFallback() {
  return (
    <div
      aria-label="History range"
      className="mt-250 flex h-[42px] w-fit rounded-8 bg-neutral-700 p-025 lg:mt-0 lg:shrink-0"
      role="tablist"
    >
      {fallbackHistoryRanges.map((range) => {
        const isActive = range === fallbackSelectedHistoryRange;

        return (
          <button
            aria-selected={isActive}
            className={cn(
              "fx-transition-surface block cursor-pointer rounded-8 px-200 py-150 text-preset-5 text-neutral-200",
              "focus-visible:shadow-[0_0_0_3px_hsl(var(--neutral-700)),0_0_0_4px_hsl(var(--lime-500))] focus-visible:outline-none",
              "disabled:cursor-not-allowed disabled:opacity-50",
              isActive && "bg-neutral-500 text-neutral-50"
            )}
            data-range-picker-tab
            data-range-value={range}
            key={range}
            role="tab"
            tabIndex={-1}
            type="button"
          >
            {range}
          </button>
        );
      })}
    </div>
  );
}

function RateDetailsNavigationFallback() {
  return (
    <nav aria-label="Rate details sections" className="relative w-full">
      <button
        aria-hidden={true}
        className={cn(
          "flex h-500 w-full items-center justify-between gap-200 rounded-8 bg-neutral-700 px-150 py-125 text-preset-3 text-neutral-50 uppercase shadow-[inset_0_0_0_1px_hsl(var(--neutral-400))] sm:hidden",
          "hover:bg-neutral-600 focus-visible:shadow-[inset_0_0_0_1px_hsl(var(--neutral-400)),0_0_0_3px_hsl(var(--neutral-600)),0_0_0_4px_hsl(var(--lime-500))] focus-visible:outline-none"
        )}
        tabIndex={-1}
        type="button"
      >
        <span className="inline-flex items-center gap-100">
          <span>History</span>
        </span>
        <Icon decorative height={7} iconName="chevron-down" width={11} />
      </button>
      <div
        className="hidden w-full items-start gap-250 shadow-[inset_0_-1px_0_0_hsl(var(--neutral-600))] sm:flex sm:gap-100"
        aria-label="Rate details sections"
        role="tablist"
      >
        {rateDetailsSectionDefinitions.map((item) => (
          <TabButton
            key={item.value}
            active={item.value === "history"}
            aria-label={item.label}
            href={item.href}
            label={item.label}
            reserveCount={item.value === "favorites" || item.value === "log"}
            scroll={false}
            tabIndex={-1}
          />
        ))}
      </div>
    </nav>
  );
}

export { RateDetailsNavigationFallback, RateHistoryFallback };
