"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

type RateDetailsListProps = {
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
    <div
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
    </div>
  );
}

type RateDetailsTreeGridProps = {
  actionSelector: string;
  children: React.ReactNode;
  columns: React.ReactNode;
  "aria-label"?: string;
  labelledBy?: string;
  onCurrentRowIdChange: (rowId: string) => void;
};

function RateDetailsTreeGrid({
  actionSelector,
  children,
  columns,
  "aria-label": ariaLabel,
  labelledBy,
  onCurrentRowIdChange,
}: RateDetailsTreeGridProps) {
  const treeGridRef = React.useRef<HTMLTableElement>(null);

  function getRows() {
    return Array.from(
      treeGridRef.current?.querySelectorAll<HTMLTableRowElement>("[data-rate-details-row]") ?? []
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
      ref={treeGridRef}
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

type RateDetailsCellProps = React.HTMLAttributes<HTMLTableCellElement> & {
  "data-rate-details-cell"?: true;
  "data-rate-details-primary-cell"?: true;
};

function isFocusableCell(child: React.ReactNode) {
  return (
    React.isValidElement<RateDetailsCellProps>(child) &&
    child.props["aria-hidden"] !== "true" &&
    child.props.role !== "presentation"
  );
}

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

  void ariaLabel;

  const childArray = React.Children.toArray(children);
  const cells = childArray.map((child, index) => {
    if (!React.isValidElement<RateDetailsCellProps>(child)) {
      return child;
    }

    if (!isFocusableCell(child)) {
      return child;
    }

    const focusableCellIndex = childArray.slice(0, index).filter(isFocusableCell).length;
    const isPrimaryCell = focusableCellIndex === 0;

    const cellProps: RateDetailsCellProps = {
      className: cn("outline-none", child.props.className),
      "data-rate-details-cell": true,
      ...(isPrimaryCell ? { "data-rate-details-primary-cell": true } : {}),
      tabIndex: isPrimaryCell ? tabIndex : -1,
    };

    return React.cloneElement(child, cellProps);
  });

  return (
    <tr
      aria-current={isSelected ? "true" : undefined}
      className={cn(
        "fx-transition-surface grid w-full cursor-pointer items-center gap-x-125 rounded-16 bg-neutral-600 px-150 py-150 text-left shadow-[inset_0_0_0_1px_hsl(var(--neutral-500))] outline-none [--fx-list-row-padding-y:var(--spacing-150)] focus-within:shadow-[inset_0_0_0_1px_hsl(var(--lime-500))] hover:shadow-[inset_0_0_0_1px_hsl(var(--neutral-300))] focus-visible:shadow-[inset_0_0_0_1px_hsl(var(--lime-500))] sm:gap-x-250 sm:px-200 sm:[--fx-list-row-padding-y:var(--spacing-150)]",
        gridClassName,
        className
      )}
      data-rate-details-row
      data-rate-details-row-id={rowId}
      onClick={onSelect}
      ref={rowRef}
      role="row"
    >
      {cells}
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

export { RateDetailsList, RateDetailsTreeGrid, RateDetailsTreeGridRow };
export type { RateDetailsRowActionProps };
