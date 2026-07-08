"use client";

import * as React from "react";

import { useRovingTabIndex } from "@/components/ui/use-roving-tabindex";
import { cn } from "@/lib/utils";

type RateDetailsListProps = {
  "aria-label": string;
  children: React.ReactNode;
  className?: string;
  countClassName?: string;
  countSlot?: React.ReactNode;
  headerClassName?: string;
  headingId: string;
  headingClassName?: string;
  headingSlot: React.ReactNode;
};

function RateDetailsList({
  "aria-label": ariaLabel,
  children,
  className,
  countClassName,
  countSlot,
  headerClassName,
  headingId,
  headingClassName,
  headingSlot,
}: RateDetailsListProps) {
  return (
    <section
      aria-label={ariaLabel}
      className={cn(
        "rounded-20 bg-neutral-700 p-200 shadow-[inset_0_0_0_1px_hsl(var(--neutral-600))] sm:p-250",
        className
      )}
    >
      <header
        className={cn(
          "flex items-center justify-between gap-200 pb-200 uppercase sm:pb-250",
          headerClassName
        )}
      >
        <h2 id={headingId} className={cn("min-w-0", headingClassName)}>
          {headingSlot}
        </h2>
        {countSlot ? <div className={cn("shrink-0", countClassName)}>{countSlot}</div> : null}
      </header>
      {children}
    </section>
  );
}

type RateDetailsTreeGridProps = {
  actionSelector: string;
  children: React.ReactNode;
  columns: React.ReactNode;
  labelledBy: string;
  onCurrentRowIdChange: (rowId: string) => void;
};

function RateDetailsTreeGrid({
  actionSelector,
  children,
  columns,
  labelledBy,
  onCurrentRowIdChange,
}: RateDetailsTreeGridProps) {
  const treeGridRef = React.useRef<HTMLTableElement>(null);
  const rovingFocus = useRovingTabIndex<HTMLTableRowElement>({
    containerRef: treeGridRef,
    itemSelector: "[data-rate-details-row]",
    onCurrentElementChange: (row) => {
      onCurrentRowIdChange(row.dataset.rateDetailsRowId ?? "");
    },
    orientation: "vertical",
  });

  function handleTreeGridKeyDown(event: React.KeyboardEvent<HTMLTableElement>) {
    const target = event.target as HTMLElement;

    if (target.closest(actionSelector)) {
      return;
    }

    rovingFocus.handleKeyDown(event);
  }

  return (
    <table
      aria-labelledby={labelledBy}
      className="block w-full border-separate border-spacing-y-150"
      onKeyDown={handleTreeGridKeyDown}
      ref={treeGridRef}
      role="treegrid"
    >
      <thead className="sr-only">
        <tr role="row">{columns}</tr>
      </thead>
      <tbody className="flex flex-col gap-150" role="rowgroup">
        {children}
      </tbody>
    </table>
  );
}

type RateDetailsRowActionProps = {
  onKeyDown: React.KeyboardEventHandler<HTMLButtonElement>;
  ref: React.Ref<HTMLButtonElement>;
  tabIndex: -1;
};

type RateDetailsTreeGridRowProps = {
  "aria-label": string;
  action: (props: RateDetailsRowActionProps) => React.ReactNode;
  children: React.ReactNode;
  className?: string;
  gridClassName: string;
  actionClassName?: string;
  isSelected?: boolean;
  onSelect: () => void;
  rowId: string;
  tabIndex: 0 | -1;
};

function RateDetailsTreeGridRow({
  "aria-label": ariaLabel,
  action,
  actionClassName,
  children,
  className,
  gridClassName,
  isSelected,
  onSelect,
  rowId,
  tabIndex,
}: RateDetailsTreeGridRowProps) {
  const rowRef = React.useRef<HTMLTableRowElement>(null);
  const actionRef = React.useRef<HTMLButtonElement>(null);

  function handleRowKeyDown(event: React.KeyboardEvent<HTMLTableRowElement>) {
    if (event.target !== event.currentTarget) {
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onSelect();
      return;
    }

    if (event.key === "Tab" && !event.shiftKey) {
      event.preventDefault();
      actionRef.current?.focus({ preventScroll: true });
      return;
    }

    if (event.key === "ArrowRight" || event.key === "F2") {
      event.preventDefault();
      actionRef.current?.focus({ preventScroll: true });
    }
  }

  function handleActionKeyDown(event: React.KeyboardEvent<HTMLButtonElement>) {
    if (
      event.key !== "ArrowLeft" &&
      event.key !== "Escape" &&
      event.key !== "F2" &&
      (event.key !== "Tab" || !event.shiftKey)
    ) {
      return;
    }

    event.preventDefault();
    rowRef.current?.focus({ preventScroll: true });
  }

  return (
    <tr
      aria-label={ariaLabel}
      aria-level={1}
      aria-selected={isSelected}
      className={cn(
        "fx-transition-surface grid w-full cursor-pointer items-center gap-x-125 rounded-16 bg-neutral-600 px-150 py-150 text-left shadow-[inset_0_0_0_1px_hsl(var(--neutral-500))] outline-none [--fx-list-row-padding-y:var(--spacing-150)] hover:shadow-[inset_0_0_0_1px_hsl(var(--neutral-300))] focus-visible:shadow-[inset_0_0_0_1px_hsl(var(--lime-500))] sm:gap-x-250 sm:px-200 sm:[--fx-list-row-padding-y:var(--spacing-150)]",
        gridClassName,
        className
      )}
      data-rate-details-row
      data-rate-details-row-id={rowId}
      onClick={onSelect}
      onKeyDown={handleRowKeyDown}
      ref={rowRef}
      role="row"
      tabIndex={tabIndex}
    >
      {children}
      <td className={cn("block", actionClassName)} role="gridcell">
        {action({
          onKeyDown: handleActionKeyDown,
          ref: actionRef,
          tabIndex: -1,
        })}
      </td>
    </tr>
  );
}

export { RateDetailsList, RateDetailsTreeGrid, RateDetailsTreeGridRow };
export type { RateDetailsRowActionProps };
