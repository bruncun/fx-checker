"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
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
  const [localRange, setLocalRange] = useState(() => ({
    range: selectedRange,
    serverRange: selectedRange,
  }));
  const currentRange = localRange.serverRange === selectedRange ? localRange.range : selectedRange;
  const [, startTransition] = useTransition();

  const getRangeUrl = useCallback(
    (nextRange: HistoryRange) => {
      const nextSearchParams = new URLSearchParams(searchParamsString);
      nextSearchParams.set("range", nextRange);

      const queryString = nextSearchParams.toString();
      return queryString ? `${pathname}?${queryString}` : pathname;
    },
    [pathname, searchParamsString]
  );

  const selectRange = useCallback(
    (value: string) => {
      if (!historyRanges.includes(value as HistoryRange) || value === currentRange) {
        return;
      }

      const nextRange = value as HistoryRange;
      const nextUrl = getRangeUrl(nextRange);
      const currentUrl = searchParamsString ? `${pathname}?${searchParamsString}` : pathname;

      setLocalRange({ range: nextRange, serverRange: selectedRange });

      if (nextUrl !== currentUrl) {
        window.history.replaceState(null, "", nextUrl);
        startTransition(() => {
          router.refresh();
        });
      }
    },
    [
      currentRange,
      getRangeUrl,
      pathname,
      router,
      searchParamsString,
      selectedRange,
      startTransition,
    ]
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
