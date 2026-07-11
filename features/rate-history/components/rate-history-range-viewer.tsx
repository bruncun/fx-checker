"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { RangePicker, type RangePickerOption } from "@/components/ui/range-picker";
import { useOptionalKeyboardShortcuts } from "@/features/keyboard-shortcuts";
import { historyRanges, type HistoryRange } from "@/features/rate-history/model/rate-history";

const ranges: RangePickerOption[] = historyRanges.map((range) => ({
  label: range,
  value: range,
}));

type RateHistoryRangePickerProps = {
  selectedRange: HistoryRange;
};

function RateHistoryRangePicker({ selectedRange }: RateHistoryRangePickerProps) {
  const router = useRouter();
  const shortcuts = useOptionalKeyboardShortcuts();
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const searchParamsString = searchParams.toString();
  const [currentRange, setCurrentRange] = useState(selectedRange);

  const selectRange = useCallback(
    (value: string) => {
      if (!historyRanges.includes(value as HistoryRange) || value === currentRange) {
        return;
      }

      const nextRange = value as HistoryRange;
      const nextSearchParams = new URLSearchParams(searchParamsString);
      nextSearchParams.set("range", nextRange);

      const queryString = nextSearchParams.toString();
      const nextUrl = queryString ? `${pathname}?${queryString}` : pathname;

      setCurrentRange(nextRange);
      router.replace(nextUrl, { scroll: false });
    },
    [currentRange, pathname, router, searchParamsString]
  );

  const selectAdjacentRange = useCallback(
    (direction: -1 | 1) => {
      const currentIndex = historyRanges.indexOf(currentRange);
      const nextRange = historyRanges[currentIndex + direction];

      if (!nextRange) {
        return;
      }

      selectRange(nextRange);
    },
    [currentRange, selectRange]
  );

  useEffect(() => {
    shortcuts?.registerHistoryRangeNavigation({
      nextRange: () => {
        selectAdjacentRange(1);
      },
      previousRange: () => {
        selectAdjacentRange(-1);
      },
    });

    return () => {
      shortcuts?.registerHistoryRangeNavigation(null);
    };
  }, [selectAdjacentRange, shortcuts]);

  return (
    <RangePicker
      aria-label="History range"
      className="mt-250 lg:mt-0 lg:shrink-0"
      onValueChange={selectRange}
      options={ranges}
      shortcutLabels={{
        next: shortcuts?.formatShortcut({ key: "ArrowRight" }) ?? "→",
        previous: shortcuts?.formatShortcut({ key: "ArrowLeft" }) ?? "←",
      }}
      value={currentRange}
    />
  );
}

export { RateHistoryRangePicker };
