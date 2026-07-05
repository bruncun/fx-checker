import { TabEmptyState } from "@/components/ui/tab-empty-state";
import {
  getRateHistoryRangePoints,
  getRateHistoryStats,
  historyRanges,
  type HistoryRange,
  type RateHistoryData,
} from "@/features/rate-history/rate-history";
import { RateHistoryChart } from "./rate-history-chart";
import { RateHistoryRangeViewer, type RateHistoryRangePanel } from "./rate-history-range-viewer";

type RateHistoryProps = {
  history: RateHistoryData | null;
  pair: string;
  selectedRange?: HistoryRange;
};

function RateHistory({ history, pair, selectedRange = "1M" }: RateHistoryProps) {
  const panels: RateHistoryRangePanel[] = history
    ? historyRanges.flatMap((range) => {
        const points = getRateHistoryRangePoints(history.points, range);
        const stats = getRateHistoryStats(points);

        if (points.length === 0 || stats.length === 0) {
          return [];
        }

        return [
          {
            chart: <RateHistoryChart pair={history.pair} points={points} range={range} />,
            range,
            stats,
          },
        ];
      })
    : [];
  const hasRateHistoryData = Boolean(history?.points.length) && panels.length > 0;

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
      <RateHistoryRangeViewer panels={panels} selectedRange={selectedRange} />
    </section>
  );
}

export { RateHistory };
