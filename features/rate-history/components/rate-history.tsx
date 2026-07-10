import { TabEmptyState } from "@/components/ui/tab-empty-state";
import { RateChange } from "@/components/ui/rate-change";
import type { HistoryRange, RateHistoryViewModel } from "@/features/rate-history/rate-history";
import { RateHistoryChart } from "./rate-history-chart";
import { RateHistoryRangePicker } from "./rate-history-range-viewer";

type RateHistoryProps = {
  model: RateHistoryViewModel | null;
  pair: string;
  selectedRange?: HistoryRange;
};

function RateHistory({ model, pair, selectedRange = "1M" }: RateHistoryProps) {
  const selectedPair = model?.pair ?? pair;
  const selectedPanel =
    model?.ranges.find((panel) => panel.range === selectedRange) ?? model?.ranges[0];

  if (!selectedPanel) {
    return (
      <TabEmptyState
        title="No chart data available"
        lead={
          <>
            We couldn&apos;t load rate history for {selectedPair} right now.
            <br />
            This usually clears up in a minute.
          </>
        }
      />
    );
  }

  return (
    <section aria-label="Rate history" className="uppercase">
      <div className="lg:flex lg:items-center lg:justify-between lg:gap-400">
        <div
          className="grid grid-cols-2 gap-125 sm:inline-grid sm:grid-cols-4 sm:gap-200"
          aria-live="polite"
          aria-atomic="true"
        >
          {selectedPanel.stats.map((stat) => (
            <article
              className="rounded-16 bg-neutral-700 px-250 py-150 shadow-[inset_0_0_0_1px_hsl(var(--neutral-600))] sm:min-w-[140px]"
              key={stat.label}
            >
              <p className="text-preset-4 text-neutral-50/70">{stat.label}</p>
              {stat.direction ? (
                <RateChange
                  className="mt-200 text-preset-2 sm:mt-200"
                  direction={stat.direction}
                  showIndicator={stat.showIndicator ?? false}
                  value={stat.value}
                />
              ) : (
                <p className="mt-200 text-preset-2 text-neutral-50">{stat.value}</p>
              )}
            </article>
          ))}
        </div>
        <RateHistoryRangePicker selectedRange={selectedPanel.range} />
      </div>
      <div className="mt-200 sm:mt-250">
        <RateHistoryChart
          chart={selectedPanel.chart}
          pair={selectedPair}
          range={selectedPanel.range}
        />
      </div>
    </section>
  );
}

export { RateHistory };
