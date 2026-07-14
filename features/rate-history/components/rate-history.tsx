import { TabEmptyState } from "@/components/ui/tab-empty-state";
import { RateChange } from "@/components/ui/rate-change";
import type {
  HistoryRange,
  RateHistoryRangeModel,
  RateHistoryViewModel,
} from "@/features/rate-history/model/rate-history";
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
    return <RateHistoryEmptyState pair={selectedPair} />;
  }

  return (
    <div className="uppercase">
      <div
        className="lg:flex lg:items-center lg:justify-between lg:gap-400"
        role="group"
        aria-label="Header"
      >
        <RateHistoryStats panel={selectedPanel} />
        <RateHistoryRangePicker selectedRange={selectedPanel.range} />
      </div>
      <RateHistoryChartPanel panel={selectedPanel} pair={selectedPair} />
    </div>
  );
}

function RateHistoryEmptyState({ pair }: { pair: string }) {
  return (
    <TabEmptyState
      title="No chart data available"
      lead={
        <>
          We couldn&apos;t load rate history for {pair} right now.
          <br className="hidden sm:inline" />
          This usually clears up in a minute.
        </>
      }
    />
  );
}

function RateHistoryStats({ panel }: { panel: RateHistoryRangeModel }) {
  return (
    <dl
      className="grid grid-cols-2 gap-125 sm:inline-grid sm:grid-cols-4 sm:gap-200"
      aria-label="Stats"
      aria-live="polite"
      aria-atomic="true"
    >
      {panel.stats.map((stat) => (
        <div
          key={stat.label}
          className="rounded-16 bg-neutral-700 px-250 py-150 shadow-[inset_0_0_0_1px_hsl(var(--neutral-600))] sm:min-w-[140px]"
        >
          <dt className="text-preset-4 text-neutral-50/70">{stat.label}</dt>
          {stat.direction ? (
            <dd>
              <RateChange
                className="mt-200 text-preset-2 sm:mt-200"
                direction={stat.direction}
                showIndicator={stat.showIndicator ?? false}
                value={stat.value}
              />
            </dd>
          ) : (
            <dd className="mt-200 text-preset-2 text-neutral-50">{stat.value}</dd>
          )}
        </div>
      ))}
    </dl>
  );
}

function RateHistoryChartPanel({ pair, panel }: { pair: string; panel: RateHistoryRangeModel }) {
  return (
    <div className="mt-200 sm:mt-250">
      <RateHistoryChart chart={panel.chart} pair={pair} range={panel.range} />
    </div>
  );
}

export { RateHistory, RateHistoryChartPanel, RateHistoryEmptyState, RateHistoryStats };
