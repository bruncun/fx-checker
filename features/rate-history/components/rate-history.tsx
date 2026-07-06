"use client";

import { TabEmptyState } from "@/components/ui/tab-empty-state";
import type { HistoryRange, RateHistoryViewModel } from "@/features/rate-history/rate-history";
import { RateHistoryRangeViewer } from "./rate-history-range-viewer";

type RateHistoryProps = {
  model: RateHistoryViewModel | null;
  pair: string;
  selectedRange?: HistoryRange;
};

function RateHistory({ model, pair, selectedRange = "1M" }: RateHistoryProps) {
  const selectedPair = model?.pair ?? pair;

  if (!model?.ranges.length) {
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
      <RateHistoryRangeViewer model={model} selectedRange={selectedRange} />
    </section>
  );
}

export { RateHistory };
