"use client";

import * as React from "react";

import { useRovingTabIndex } from "@/components/ui/use-roving-tabindex";
import { LiveRateItem, type LiveRate } from "./live-rate-item";
import { cn } from "@/lib/utils";

type LiveRateListProps = {
  onRateSelect?: (rate: LiveRate) => void;
  rates: LiveRate[];
};

export function LiveRateList({ onRateSelect, rates }: LiveRateListProps) {
  const labelId = React.useId();
  const toolbarRef = React.useRef<HTMLDivElement>(null);
  const [tabStopPair, setTabStopPair] = React.useState(rates[0]?.pair ?? "");
  const rovingFocus = useRovingTabIndex<HTMLButtonElement>({
    containerRef: toolbarRef,
    itemSelector: "[data-live-rate-option]",
    onCurrentElementChange: (button) => {
      setTabStopPair(button.dataset.liveRatePair ?? "");
    },
    orientation: "horizontal",
  });

  React.useEffect(() => {
    if (rates.length === 0) {
      setTabStopPair("");
      return;
    }

    if (!rates.some((rate) => rate.pair === tabStopPair)) {
      setTabStopPair(rates[0]?.pair ?? "");
    }
  }, [rates, tabStopPair]);

  return (
    <section className="relative flex w-full bg-neutral-700">
      <div
        className={cn(
          "flex shrink-0 items-center gap-100 bg-lime-500 px-100 py-150 text-preset-6 text-neutral-900 uppercase",
          "sm:h-500 sm:px-200 sm:text-preset-5-medium"
        )}
      >
        <span className="size-[6px] rounded-full bg-neutral-900" aria-hidden="true" />
        <span id={labelId}>Live markets</span>
      </div>
      <div
        className="min-w-0 flex-1 overflow-x-auto"
        role="region"
        aria-label="Live exchange rates"
      >
        <div
          ref={toolbarRef}
          aria-labelledby={labelId}
          onKeyDown={rovingFocus.handleKeyDown}
          role="toolbar"
        >
          <ul
            className="flex w-max divide-x divide-neutral-500 border-r border-neutral-500"
            aria-label="Live exchange rates"
          >
            {rates.map((rate) => (
              <LiveRateItem
                key={rate.pair}
                rate={rate}
                onFocus={() => {
                  setTabStopPair(rate.pair);
                }}
                onSelect={onRateSelect}
                tabIndex={rate.pair === tabStopPair ? 0 : -1}
              />
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
