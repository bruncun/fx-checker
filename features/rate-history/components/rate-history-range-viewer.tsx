"use client";

import { useMemo, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

import { RateChange } from "@/components/ui/rate-change";
import { RangePicker, type RangePickerOption } from "@/components/ui/range-picker";
import {
  historyRanges,
  type HistoryRange,
  type RateHistoryViewModel,
} from "@/features/rate-history/rate-history";
import { RateHistoryChart } from "./rate-history-chart";

const ranges: RangePickerOption[] = historyRanges.map((range) => ({
  label: range,
  value: range,
}));

type RateHistoryRangeViewerProps = {
  model: RateHistoryViewModel;
  selectedRange: HistoryRange;
};

function RateHistoryRangeViewer({ model, selectedRange }: RateHistoryRangeViewerProps) {
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const searchParamsString = searchParams.toString();
  const [currentRange, setCurrentRange] = useState(selectedRange);
  const selectedPanel = useMemo(
    () => model.ranges.find((panel) => panel.range === currentRange) ?? model.ranges[0],
    [currentRange, model.ranges]
  );

  function selectRange(value: string) {
    if (!historyRanges.includes(value as HistoryRange) || value === currentRange) {
      return;
    }

    const nextRange = value as HistoryRange;
    const nextSearchParams = new URLSearchParams(searchParamsString);
    nextSearchParams.set("range", nextRange);

    const queryString = nextSearchParams.toString();
    const nextUrl = queryString ? `${pathname}?${queryString}` : pathname;

    setCurrentRange(nextRange);
    window.history.replaceState(window.history.state, "", nextUrl);
  }

  if (!selectedPanel) {
    return null;
  }

  return (
    <>
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
        <RangePicker
          aria-label="History range"
          className="mt-250 lg:mt-0 lg:shrink-0"
          onValueChange={selectRange}
          options={ranges}
          value={currentRange}
        />
      </div>
      <div className="mt-200 sm:mt-250">
        {model.ranges.map((panel) => (
          <div hidden={panel.range !== currentRange} key={panel.range}>
            <RateHistoryChart chart={panel.chart} pair={model.pair} range={panel.range} />
          </div>
        ))}
      </div>
    </>
  );
}

export { RateHistoryRangeViewer };
