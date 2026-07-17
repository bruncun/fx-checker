"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import { RateDetailsList } from "./rate-details-list-shell";

type RateDetailsInteractiveTableProps = {
  actionSelector: string;
  children: React.ReactNode;
  columns: React.ReactNode;
  "aria-label"?: string;
  labelledBy?: string;
  onCurrentRowIdChange: (rowId: string) => void;
};

function RateDetailsInteractiveTable({
  actionSelector,
  children,
  columns,
  "aria-label": ariaLabel,
  labelledBy,
  onCurrentRowIdChange,
}: RateDetailsInteractiveTableProps) {
  const tableRef = React.useRef<HTMLTableElement>(null);

  function getRows() {
    return Array.from(
      tableRef.current?.querySelectorAll<HTMLTableRowElement>("[data-rate-details-row]") ?? []
    );
  }

  function getRowTargets(row: HTMLTableRowElement) {
    return Array.from(
      row.querySelectorAll<HTMLElement>(
        "[data-rate-details-primary-cell], [data-rate-details-action]"
      )
    );
  }

  function focusTarget(target: HTMLElement | undefined) {
    if (!target) {
      return;
    }

    getRows().forEach((row) => {
      getRowTargets(row).forEach((rowTarget) => {
        rowTarget.tabIndex = rowTarget === target ? 0 : -1;
      });
    });

    const row = target.closest<HTMLTableRowElement>("[data-rate-details-row]");

    if (row) {
      onCurrentRowIdChange(row.dataset.rateDetailsRowId ?? "");
    }

    target.focus({ preventScroll: true });
    target.scrollIntoView?.({ block: "nearest", inline: "nearest" });
  }

  function handleTableKeyDown(event: React.KeyboardEvent<HTMLTableElement>) {
    const target = event.target as HTMLElement | null;

    if (!target) {
      return;
    }

    const row = target.closest<HTMLTableRowElement>("[data-rate-details-row]");

    if (!row) {
      return;
    }

    const rows = getRows();
    const rowIndex = rows.indexOf(row);
    const rowTargets = getRowTargets(row);
    const targetIndex = rowTargets.indexOf(target);

    if (rowIndex === -1 || targetIndex === -1) {
      return;
    }

    const isAction = Boolean(target.closest(actionSelector));

    if ((event.key === "Enter" || event.key === " ") && !isAction) {
      event.preventDefault();
      row.click();
      return;
    }

    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();

      const nextRowIndex =
        event.key === "ArrowDown"
          ? (rowIndex + 1) % rows.length
          : (rowIndex - 1 + rows.length) % rows.length;

      focusTarget(
        getRowTargets(rows[nextRowIndex])[
          Math.min(targetIndex, getRowTargets(rows[nextRowIndex]).length - 1)
        ]
      );
      return;
    }

    if (event.key === "ArrowRight") {
      event.preventDefault();
      focusTarget(rowTargets[Math.min(targetIndex + 1, rowTargets.length - 1)]);
      return;
    }

    if (event.key === "ArrowLeft") {
      event.preventDefault();
      focusTarget(rowTargets[Math.max(targetIndex - 1, 0)]);
      return;
    }

    if (event.key === "Home") {
      event.preventDefault();
      focusTarget(rowTargets[0]);
      return;
    }

    if (event.key === "End") {
      event.preventDefault();
      focusTarget(rowTargets[rowTargets.length - 1]);
      return;
    }

    if (event.key === "F2" || event.key === "Escape") {
      if (isAction) {
        event.preventDefault();
        focusTarget(rowTargets[Math.max(targetIndex - 1, 0)]);
        return;
      }

      event.preventDefault();
      focusTarget(rowTargets[rowTargets.length - 1]);
      return;
    }

    if (event.key === "Tab" && !event.shiftKey && !isAction) {
      event.preventDefault();
      focusTarget(rowTargets[Math.min(targetIndex + 1, rowTargets.length - 1)]);
      return;
    }

    if (event.key === "Tab" && event.shiftKey && targetIndex > 0) {
      event.preventDefault();
      focusTarget(rowTargets[targetIndex - 1]);
    }
  }

  return (
    <table
      aria-label={ariaLabel}
      aria-labelledby={labelledBy}
      className="block w-full border-separate border-spacing-y-150"
      onKeyDown={handleTableKeyDown}
      ref={tableRef}
      // Production semantics intentionally remain table-like while this composite navigation
      // pattern awaits a table-vs-grid screen reader audit.
      role="table"
    >
      <thead className="sr-only">
        <tr>{columns}</tr>
      </thead>
      <tbody className="flex flex-col gap-150">{children}</tbody>
    </table>
  );
}

type RateDetailsRowActionProps = {
  "data-rate-details-action": true;
  ref: React.Ref<HTMLButtonElement>;
  tabIndex: 0 | -1;
};

type RateDetailsInteractiveTableCellProps = React.TdHTMLAttributes<HTMLTableCellElement> & {
  isPrimary?: boolean;
};

type RateDetailsInteractiveTableRowProps = {
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

function RateDetailsInteractiveTableCell({
  children,
  className,
  isPrimary = false,
  tabIndex = -1,
  ...props
}: RateDetailsInteractiveTableCellProps) {
  return (
    <td
      {...props}
      className={cn("outline-none", className)}
      data-rate-details-cell
      data-rate-details-primary-cell={isPrimary ? true : undefined}
      role="cell"
      tabIndex={tabIndex}
    >
      {children}
    </td>
  );
}

function RateDetailsInteractiveTableRow({
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
}: RateDetailsInteractiveTableRowProps) {
  const actionRef = React.useRef<HTMLButtonElement>(null);

  return (
    <tr
      aria-label={ariaLabel}
      aria-current={isSelected ? "true" : undefined}
      className={cn(
        "fx-transition-surface grid w-full cursor-pointer items-center gap-x-125 rounded-16 bg-neutral-600 px-150 py-150 text-left shadow-[inset_0_0_0_1px_hsl(var(--neutral-500))] outline-none [--fx-list-row-padding-y:var(--spacing-150)] focus-within:shadow-[inset_0_0_0_1px_hsl(var(--lime-500))] hover:shadow-[inset_0_0_0_1px_hsl(var(--neutral-300))] focus-visible:shadow-[inset_0_0_0_1px_hsl(var(--lime-500))] sm:gap-x-250 sm:px-200 sm:[--fx-list-row-padding-y:var(--spacing-150)]",
        gridClassName,
        className
      )}
      data-rate-details-row
      data-rate-details-row-id={rowId}
      onClick={onSelect}
      role="row"
    >
      {children}
      <td className={cn("block", actionClassName)} role="cell">
        {action({
          "data-rate-details-action": true,
          ref: actionRef,
          tabIndex,
        })}
      </td>
    </tr>
  );
}

const RateDetailsTreeGrid = RateDetailsInteractiveTable;
const RateDetailsTreeGridCell = RateDetailsInteractiveTableCell;
const RateDetailsTreeGridRow = RateDetailsInteractiveTableRow;

export {
  RateDetailsList,
  RateDetailsInteractiveTable,
  RateDetailsInteractiveTableCell,
  RateDetailsInteractiveTableRow,
  RateDetailsTreeGrid,
  RateDetailsTreeGridCell,
  RateDetailsTreeGridRow,
};
export type { RateDetailsRowActionProps };
