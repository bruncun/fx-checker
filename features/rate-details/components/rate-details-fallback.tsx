import { Icon } from "@/components/ui/icon";
import { TabButton } from "@/components/ui/tab-button";
import { cn } from "@/lib/utils";
import type { CSSProperties } from "react";
import { rateDetailsSectionDefinitions } from "./rate-details-navigation-state";

const fallbackHistoryRanges = ["1D", "1W", "1M", "3M", "1Y", "5Y"];
const fallbackHistoryStats = [
  { label: "Open", width: 69 },
  { label: "Last", width: 69 },
  { label: "Change", width: 81 },
  { label: "% Change", width: 95 },
];

function SkeletonBlock({ className, style }: { className: string; style?: CSSProperties }) {
  return <span aria-hidden className={cn("fx-skeleton block", className)} style={style} />;
}

function RateHistoryFallback() {
  return (
    <section aria-busy="true" aria-label="Rate history" className="uppercase">
      <div className="lg:flex lg:items-center lg:justify-between lg:gap-400">
        <div className="grid grid-cols-2 gap-125 sm:inline-grid sm:grid-cols-4 sm:gap-200">
          {fallbackHistoryStats.map((stat) => (
            <article
              className="rounded-16 bg-neutral-700 px-250 py-150 shadow-[inset_0_0_0_1px_hsl(var(--neutral-600))] sm:min-w-[140px]"
              key={stat.label}
            >
              <p className="text-preset-4 text-neutral-50/70">{stat.label}</p>
              <SkeletonBlock className="mt-200 h-300 rounded-6" style={{ width: stat.width }} />
            </article>
          ))}
        </div>
        <RangePickerFallback />
      </div>
      <ChartFallback />
    </section>
  );
}

function ChartFallback() {
  return (
    <section className="mt-200 min-h-[369px] rounded-16 bg-neutral-700 px-150 py-200 shadow-[inset_0_0_0_1px_hsl(var(--neutral-600))] sm:mt-250 sm:p-250">
      <div className="flex h-[19px] items-center justify-between gap-150">
        <SkeletonBlock className="h-[19px] w-[74px] rounded-4" />
        <div className="flex items-center gap-075">
          <SkeletonBlock className="h-[14px] w-[46px] rounded-4" />
          <span aria-hidden="true" className="w-[11px] text-center text-preset-5 text-neutral-200">
            ·
          </span>
          <SkeletonBlock className="h-[14px] w-[116] rounded-4" />
        </div>
      </div>
      <div className="mt-250 grid grid-cols-[36px_1fr] gap-x-200">
        <div className="relative h-[272px]">
          {[0, 136, 272].map((top, index) => (
            <SkeletonBlock
              className="absolute left-0 h-125 w-[36px] rounded-4"
              key={top}
              style={{
                top,
                transform:
                  index === 0
                    ? "translateY(0)"
                    : index === 2
                      ? "translateY(-100%)"
                      : "translateY(-50%)",
              }}
            />
          ))}
        </div>
        <div className="relative h-[272px] w-full overflow-hidden">
          <svg
            aria-hidden="true"
            className="absolute inset-0 h-[272px] w-full"
            fill="none"
            preserveAspectRatio="none"
            viewBox="0 0 267 272"
          >
            <g className="stroke-neutral-500" strokeDasharray="4 4">
              {[0, 136, 272].map((y) => (
                <line key={y} vectorEffect="non-scaling-stroke" x1="0" x2="267" y1={y} y2={y} />
              ))}
            </g>
            <path
              className="fx-skeleton-trace stroke-neutral-400/70"
              d="M0 194 L36 170 L72 184 L108 146 L148 118 L186 124 L226 92 L267 78"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
        </div>
        <div aria-hidden="true" />
        <div className="mt-200 flex justify-between">
          {[
            { className: "", width: 36 },
            { className: "hidden sm:block", width: 30 },
            { className: "", width: 36 },
            { className: "hidden sm:block", width: 30 },
            { className: "", width: 36 },
          ].map((label, index) => (
            <SkeletonBlock
              className={cn("h-125 rounded-4", label.className)}
              key={`${label.width}-${index}`}
              style={{ width: label.width }}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function RangePickerFallback() {
  return (
    <div
      aria-label="History range"
      aria-busy="true"
      className="relative mt-250 flex h-[42px] w-fit overflow-hidden rounded-8 bg-neutral-700 p-025 lg:mt-0 lg:shrink-0"
      role="tablist"
    >
      <span aria-hidden="true" className="fx-skeleton absolute inset-025 rounded-8 opacity-30" />
      {fallbackHistoryRanges.map((range) => (
        <button
          aria-selected={false}
          className={cn(
            "fx-transition-surface relative block cursor-default rounded-8 px-200 py-150 text-preset-5 text-neutral-200",
            "disabled:opacity-100"
          )}
          data-range-picker-tab
          data-range-value={range}
          disabled
          key={range}
          role="tab"
          tabIndex={-1}
          type="button"
        >
          {range}
        </button>
      ))}
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
