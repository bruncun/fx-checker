"use client";

import { TabEmptyState } from "@/components/ui/tab-empty-state";
import type { HistoryRange, RateHistoryViewModel } from "@/features/rate-history/rate-history";
import { RateHistoryRangeViewer } from "./rate-history-range-viewer";

type RateHistoryProps = {
  model: RateHistoryViewModel | null;
  selectedRange?: HistoryRange;
};

function RateHistory({ model, selectedRange = "1M" }: RateHistoryProps) {
  if (!model?.ranges.length) {
    return (
      <TabEmptyState
        title="No chart data available"
        lead={
          <>
            We couldn&apos;t load rate history for this pair right now.
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
