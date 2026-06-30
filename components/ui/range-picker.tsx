"use client";

import * as React from "react";

import { useRovingTabIndex } from "@/components/ui/use-roving-tabindex";
import { cn } from "@/lib/utils";

type RangePickerOption = {
  label: string;
  value: string;
};

type RangePickerProps = {
  "aria-label": string;
  className?: string;
  disabled?: boolean;
  onValueChange?: (value: string) => void;
  options: RangePickerOption[];
  value: string;
};

function RangePicker({
  "aria-label": ariaLabel,
  className,
  disabled = false,
  onValueChange,
  options,
  value,
}: RangePickerProps) {
  const tabListRef = React.useRef<HTMLDivElement>(null);
  const rovingFocus = useRovingTabIndex<HTMLButtonElement>({
    containerRef: tabListRef,
    itemSelector: "[data-range-picker-tab]",
    onCurrentElementChange: React.useCallback(
      (element: HTMLButtonElement) => {
        const nextValue = element.dataset.rangeValue;

        if (!nextValue || nextValue === value) {
          return;
        }

        onValueChange?.(nextValue);
      },
      [onValueChange, value]
    ),
    orientation: "horizontal",
  });

  return (
    <div
      ref={tabListRef}
      aria-label={ariaLabel}
      className={cn("flex w-fit rounded-8 bg-neutral-700 p-025", className)}
      onKeyDown={disabled ? undefined : rovingFocus.handleKeyDown}
      role="tablist"
    >
      {options.map((option) => {
        const isActive = option.value === value;

        return (
          <button
            aria-selected={isActive}
            className={cn(
              "block cursor-pointer rounded-8 px-200 py-150 text-preset-5 text-neutral-200",
              "focus-visible:shadow-[0_0_0_3px_hsl(var(--neutral-700)),0_0_0_4px_hsl(var(--lime-500))] focus-visible:outline-none",
              "disabled:cursor-not-allowed disabled:opacity-50",
              isActive && "bg-neutral-500 text-neutral-50"
            )}
            data-range-picker-tab
            data-range-value={option.value}
            disabled={disabled}
            key={option.value}
            onClick={() => {
              if (!isActive) {
                onValueChange?.(option.value);
              }
            }}
            role="tab"
            tabIndex={isActive ? 0 : -1}
            type="button"
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

export { RangePicker };
export type { RangePickerOption };
