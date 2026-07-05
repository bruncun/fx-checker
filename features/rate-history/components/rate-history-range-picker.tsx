"use client";

import { RangePicker, type RangePickerOption } from "@/components/ui/range-picker";
import { historyRanges, type HistoryRange } from "@/features/rate-history/rate-history";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { startTransition, useState } from "react";

const ranges: RangePickerOption[] = historyRanges.map((range) => ({
  label: range,
  value: range,
}));

type RateHistoryRangePickerProps = {
  selectedRange: HistoryRange;
};

function RateHistoryRangePicker({ selectedRange }: RateHistoryRangePickerProps) {
  const pathname = usePathname() ?? "/";
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchParamsString = searchParams.toString();
  const [optimisticSelection, setOptimisticSelection] = useState<{
    range: HistoryRange;
    sourceRange: HistoryRange;
  } | null>(null);
  const optimisticSelectedRange =
    optimisticSelection?.sourceRange === selectedRange ? optimisticSelection.range : selectedRange;

  function selectRange(value: string) {
    if (!historyRanges.includes(value as HistoryRange) || value === optimisticSelectedRange) {
      return;
    }

    const nextRange = value as HistoryRange;
    const nextSearchParams = new URLSearchParams(searchParamsString);
    nextSearchParams.set("range", nextRange);

    const queryString = nextSearchParams.toString();
    const nextUrl = queryString ? `${pathname}?${queryString}` : pathname;

    setOptimisticSelection({ range: nextRange, sourceRange: selectedRange });

    startTransition(() => {
      router.replace(nextUrl, { scroll: false });
    });
  }

  return (
    <RangePicker
      aria-label="History range"
      className="mt-250 lg:mt-0 lg:shrink-0"
      onValueChange={selectRange}
      options={ranges}
      value={optimisticSelectedRange}
    />
  );
}

export { RateHistoryRangePicker };
