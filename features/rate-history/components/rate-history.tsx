import { RateChange } from "@/components/ui/rate-change";
import { TabEmptyState } from "@/components/ui/tab-empty-state";
import {
  getRateHistoryRangePoints,
  getRateHistoryStats,
  type HistoryRange,
  type RateHistoryData,
} from "@/features/rate-history/rate-history";
import { RateHistoryChart } from "./rate-history-chart";
import { RateHistoryRangePicker } from "./rate-history-range-picker";

type RateHistoryProps = {
  history: RateHistoryData | null;
  pair: string;
  selectedRange?: HistoryRange;
};

function RateHistory({ history, pair, selectedRange = "1M" }: RateHistoryProps) {
  const selectedPoints = history ? getRateHistoryRangePoints(history.points, selectedRange) : [];
  const stats = getRateHistoryStats(selectedPoints);
  const hasRateHistoryData =
    Boolean(history?.points.length) && selectedPoints.length > 0 && stats.length > 0;

  if (!hasRateHistoryData) {
    return (
      <TabEmptyState
        title="No chart data available"
        lead={
          <>
            We couldn&apos;t load rate history for {pair} right now.
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
          {stats.map((stat) => (
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
        <RateHistoryRangePicker selectedRange={selectedRange} />
      </div>
      <div className="mt-200 sm:mt-250">
        <RateHistoryChart
          pair={history?.pair ?? pair}
          points={selectedPoints}
          range={selectedRange}
        />
      </div>
    </section>
  );
}

export { RateHistory };
