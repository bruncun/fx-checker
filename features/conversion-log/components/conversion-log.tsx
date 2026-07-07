"use client";

import * as React from "react";

import { ClearButton } from "@/components/ui/clear-button";
import { DeleteButton } from "@/components/ui/delete-button";
import { Icon } from "@/components/ui/icon";
import {
  RateDetailsList,
  RateDetailsTreeGrid,
  RateDetailsTreeGridRow,
} from "@/components/ui/rate-details-list";
import { TabEmptyState } from "@/components/ui/tab-empty-state";
import { useRovingTabIndex } from "@/components/ui/use-roving-tabindex";
import type { Conversion } from "@/features/conversion-log";
import { deleteAllConversions, deleteConversion } from "@/features/conversion-log/client";
import {
  clearOptimisticConversions,
  removeOptimisticConversion,
  setConversionSnapshot,
  useOptimisticConversions,
} from "@/features/conversion-log/optimistic-conversions";
import type { AvailableCurrency } from "@/features/converter/currencies";
import { MoneyDecimal } from "@/features/converter/exchange";
import { useDataUnavailableError } from "@/features/home/components/use-data-unavailable-error";
import { getCurrencyByCode, getCurrencyPairUrl } from "@/features/home/url-state";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

function formatAmount(amount: string) {
  try {
    const decimal = new MoneyDecimal(amount);
    const fractionDigits = Math.max(0, decimal.decimalPlaces());

    return new Intl.NumberFormat("en-US", {
      maximumFractionDigits: fractionDigits,
      minimumFractionDigits: fractionDigits,
    }).format(decimal.toNumber());
  } catch {
    return amount;
  }
}

function formatRelativeTime(createdAt: string, now = new Date()) {
  const createdAtDate = new Date(createdAt);
  const elapsedMilliseconds = now.getTime() - createdAtDate.getTime();

  if (Number.isNaN(createdAtDate.getTime()) || elapsedMilliseconds < 0) {
    return "Now";
  }

  const elapsedMinutes = Math.floor(elapsedMilliseconds / 60_000);

  if (elapsedMinutes < 1) {
    return "Now";
  }

  if (elapsedMinutes < 60) {
    return `${elapsedMinutes}M`;
  }

  const elapsedHours = Math.floor(elapsedMinutes / 60);

  if (elapsedHours < 24) {
    return `${elapsedHours}H`;
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(createdAtDate);
}

function escapeCsvCell(value: string) {
  if (!/[",\n\r]/.test(value)) {
    return value;
  }

  return `"${value.replaceAll('"', '""')}"`;
}

function getConversionLogCsv(conversions: Conversion[]) {
  const rows = [
    ["created_at", "from_currency", "to_currency", "send_amount", "receive_amount"],
    ...conversions.map((conversion) => [
      conversion.createdAt,
      conversion.fromCurrency,
      conversion.toCurrency,
      conversion.sendAmount,
      conversion.receiveAmount,
    ]),
  ];

  return rows.map((row) => row.map(escapeCsvCell).join(",")).join("\n");
}

function getConversionLogCsvFileName(now = new Date()) {
  const date = new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "UTC",
    year: "numeric",
  }).format(now);

  return `conversion-log-${date}.csv`;
}

function downloadCsv({ csv, fileName }: { csv: string; fileName: string }) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}

function ConversionLogToolbar({ children }: { children: React.ReactNode }) {
  const toolbarRef = React.useRef<HTMLDivElement>(null);
  const rovingFocus = useRovingTabIndex<HTMLButtonElement>({
    containerRef: toolbarRef,
    itemSelector: "[data-conversion-log-toolbar-button]:not(:disabled)",
    orientation: "horizontal",
  });

  React.useLayoutEffect(() => {
    const items = rovingFocus.getItems();
    const focusedItem = items.find((item) => item === document.activeElement);
    const currentTabStop = items.find((item) => item.tabIndex === 0);
    const tabStop = focusedItem ?? currentTabStop ?? items[0];

    items.forEach((item) => {
      item.tabIndex = item === tabStop ? 0 : -1;
    });
  });

  return (
    <div
      ref={toolbarRef}
      aria-label="Conversion log actions"
      className="flex items-center gap-100"
      onKeyDown={rovingFocus.handleKeyDown}
      role="toolbar"
    >
      {children}
    </div>
  );
}

type ConversionLogItemProps = {
  conversion: Conversion;
  onConversionDelete: (id: string) => void;
  onConversionSelect: (conversion: Conversion) => void;
  tabIndex: 0 | -1;
};

function ConversionLogItem({
  conversion,
  onConversionDelete,
  onConversionSelect,
  tabIndex,
}: ConversionLogItemProps) {
  const pair = `${conversion.fromCurrency}/${conversion.toCurrency}`;
  const sendAmount = formatAmount(conversion.sendAmount);
  const receiveAmount = formatAmount(conversion.receiveAmount);
  const rowLabel = `Load ${pair} conversion, sent ${sendAmount}, received ${receiveAmount}`;

  return (
    <RateDetailsTreeGridRow
      aria-label={rowLabel}
      action={(actionProps) => (
        <DeleteButton
          {...actionProps}
          aria-label={`Delete ${pair} conversion`}
          onClick={(event) => {
            event.stopPropagation();
            onConversionDelete(conversion.id);
          }}
          data-conversion-delete-button
        />
      )}
      actionClassName="col-start-3 row-span-2 row-start-1 justify-self-end sm:col-start-4 sm:row-span-1 sm:row-start-auto"
      gridClassName="grid-cols-[minmax(0,1fr)_minmax(9ch,auto)_auto] grid-rows-[auto_auto] sm:grid-rows-none sm:grid-cols-[64px_minmax(0,1fr)_auto_auto] sm:gap-x-200 sm:py-200"
      onSelect={() => onConversionSelect(conversion)}
      rowId={conversion.id}
      tabIndex={tabIndex}
    >
      <td
        className="col-start-1 row-start-1 block min-w-0 text-preset-4 text-neutral-200 drop-shadow-[0_4px_4px_rgb(0_0_0_/_0.25)] sm:col-start-1 sm:row-start-auto sm:w-[64px]"
        role="gridcell"
      >
        {formatRelativeTime(conversion.createdAt)}
      </td>
      <td
        className="col-start-1 row-start-2 block min-w-0 leading-0 sm:col-start-2 sm:row-start-auto"
        role="gridcell"
      >
        <span className="inline-flex min-w-0 items-center gap-100 text-preset-4 text-neutral-50 uppercase">
          <span>{conversion.fromCurrency}</span>
          <Icon decorative iconName="arrow-right" />
          <span>{conversion.toCurrency}</span>
        </span>
      </td>
      <td
        className="col-start-2 row-span-2 row-start-1 flex min-w-0 flex-col gap-[2px] self-center text-right text-preset-3 sm:col-start-3 sm:row-span-1 sm:row-start-auto sm:flex-row sm:gap-[20px] sm:self-auto"
        role="gridcell"
      >
        <span className="block truncate text-neutral-100">{sendAmount}</span>
        <span aria-hidden className="block truncate text-lime-500 sm:inline">
          {receiveAmount}
        </span>
      </td>
      <td className="hidden" role="gridcell" />
    </RateDetailsTreeGridRow>
  );
}

type ConversionLogProps = {
  availableCurrencies: AvailableCurrency[];
  conversions: Conversion[];
  isGuestMode?: boolean;
};

function ConversionLog({
  availableCurrencies,
  conversions: initialConversions,
  isGuestMode = false,
}: ConversionLogProps) {
  const pathname = usePathname() ?? "/";
  const router = useRouter();
  const showDataUnavailableError = useDataUnavailableError();
  const searchParams = useSearchParams();
  const searchParamsString = searchParams.toString();
  const conversions = useOptimisticConversions(initialConversions);
  const [preferredTabStopId, setPreferredTabStopId] = React.useState(conversions[0]?.id ?? "");
  const tabStopId = conversions.some((conversion) => conversion.id === preferredTabStopId)
    ? preferredTabStopId
    : (conversions[0]?.id ?? "");

  function selectConversion(conversion: Conversion) {
    const sendCurrency = getCurrencyByCode(availableCurrencies, conversion.fromCurrency);
    const receiveCurrency = getCurrencyByCode(availableCurrencies, conversion.toCurrency);

    if (!sendCurrency || !receiveCurrency) {
      return;
    }

    const nextUrl = getCurrencyPairUrl({
      amount: conversion.sendAmount,
      amountSource: "send",
      pathname,
      receiveCurrency,
      searchParams: new URLSearchParams(searchParamsString),
      sendCurrency,
    });

    router.replace(nextUrl, { scroll: false });
  }

  function removeConversion(id: string) {
    const removedConversion = conversions.find((conversion) => conversion.id === id);

    removeOptimisticConversion(id);

    React.startTransition(async () => {
      try {
        await deleteConversion(id);
        router.refresh();
      } catch (error) {
        console.error("Failed to delete conversion", error);

        if (removedConversion) {
          setConversionSnapshot(conversions);
        }

        showDataUnavailableError();
      }
    });
  }

  function clearConversions() {
    if (conversions.length === 0) {
      return;
    }

    const previousConversions = conversions;

    clearOptimisticConversions();

    React.startTransition(async () => {
      try {
        await deleteAllConversions();
        router.refresh();
      } catch (error) {
        console.error("Failed to clear conversions", error);
        setConversionSnapshot(previousConversions);
        showDataUnavailableError();
      }
    });
  }

  function exportConversions() {
    if (conversions.length === 0) {
      return;
    }

    downloadCsv({
      csv: getConversionLogCsv(conversions),
      fileName: getConversionLogCsvFileName(),
    });
  }

  if (conversions.length === 0) {
    return (
      <TabEmptyState
        title="No conversions logged yet"
        lead={
          <>
            Every conversion is recorded here automatically when you tap LOG CONVERSION.
            <br />
            {isGuestMode
              ? "Your log is private to this session and this browser."
              : "Your log is private to your account."}
          </>
        }
      />
    );
  }

  return (
    <RateDetailsList
      aria-label="Conversion log"
      className="py-250"
      countClassName="mt-[10px] w-full sm:mt-0 sm:w-auto"
      countSlot={
        <div className="flex items-center justify-between gap-200">
          <p className="text-preset-5 text-neutral-50 opacity-70">{conversions.length} Logged</p>
          <ConversionLogToolbar>
            <ClearButton
              aria-label="Export conversions as CSV"
              data-conversion-log-toolbar-button
              disabled={conversions.length === 0}
              onClick={exportConversions}
              tabIndex={0}
            >
              Export
            </ClearButton>
            <ClearButton
              aria-label="Clear all conversions"
              data-conversion-log-toolbar-button
              disabled={conversions.length === 0}
              onClick={clearConversions}
              tabIndex={-1}
            />
          </ConversionLogToolbar>
        </div>
      }
      headerClassName="block pb-250 sm:flex sm:items-center sm:justify-between"
      headingId="conversion-log-heading"
      headingSlot={
        <span className="block text-preset-3-medium text-neutral-50">Conversion Log</span>
      }
    >
      <RateDetailsTreeGrid
        actionSelector="[data-conversion-delete-button]"
        labelledBy="conversion-log-heading"
        onCurrentRowIdChange={setPreferredTabStopId}
        columns={
          <>
            <th role="columnheader" scope="col">
              Created
            </th>
            <th role="columnheader" scope="col">
              Pair
            </th>
            <th role="columnheader" scope="col">
              Send
            </th>
            <th role="columnheader" scope="col">
              Receive
            </th>
            <th role="columnheader" scope="col">
              Delete
            </th>
          </>
        }
      >
        {conversions.map((conversion) => (
          <ConversionLogItem
            key={conversion.id}
            conversion={conversion}
            onConversionDelete={removeConversion}
            onConversionSelect={selectConversion}
            tabIndex={conversion.id === tabStopId ? 0 : -1}
          />
        ))}
      </RateDetailsTreeGrid>
    </RateDetailsList>
  );
}

export { ConversionLog, formatRelativeTime, getConversionLogCsv };
