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
import { TabPendingState } from "@/components/ui/tab-pending-state";
import { useTransitioningList } from "@/hooks/use-transitioning-list";
import { useRovingTabIndex } from "@/hooks/use-roving-tabindex";
import type { Conversion } from "@/features/conversion-log";
import { deleteAllConversions, deleteConversion } from "@/features/conversion-log/api/client";
import {
  clearOptimisticConversions,
  removeOptimisticConversion,
  setConversionSnapshot,
  useOptimisticConversions,
} from "@/features/conversion-log/stores/optimistic-conversions";
import type { AvailableCurrency } from "@/features/converter/model/currencies";
import { MoneyDecimal } from "@/features/converter/model/exchange";
import { useDataUnavailableError } from "@/features/home/hooks/use-data-unavailable-error";
import { scrollConverterIntoViewIfNeeded } from "@/features/home/utils/scroll-converter-into-view";
import { getCurrencyByCode, getCurrencyPairUrl } from "@/features/home/utils/url-state";
import { cn } from "@/lib/utils";
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

function getConversionMotionKey(conversion: Conversion) {
  return conversion.id;
}

function getConversionContentKey(conversion: Conversion) {
  return [
    conversion.fromCurrency,
    conversion.toCurrency,
    conversion.sendAmount,
    conversion.receiveAmount,
  ].join(":");
}

function getReplacedOptimisticConversionKey({
  currentKeys,
  item,
  previousItems,
}: {
  currentKeys: Set<string>;
  item: Conversion;
  previousItems: Conversion[];
}) {
  const contentKey = getConversionContentKey(item);
  const replacedOptimisticConversion = previousItems.find(
    (conversion) =>
      conversion.id.startsWith("optimistic:") &&
      !currentKeys.has(getConversionMotionKey(conversion)) &&
      getConversionContentKey(conversion) === contentKey
  );

  return replacedOptimisticConversion?.id ?? null;
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
      aria-label="Actions"
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
  isEntering?: boolean;
  isExiting?: boolean;
  onConversionDelete: (id: string) => void;
  onConversionSelect: (conversion: Conversion) => void;
  tabIndex: 0 | -1;
};

function ConversionLogItem({
  conversion,
  isEntering = false,
  isExiting = false,
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
          onClick={(event) => {
            event.stopPropagation();
            onConversionDelete(conversion.id);
          }}
          data-conversion-delete-button
        />
      )}
      actionClassName="col-start-3 row-span-2 row-start-1 justify-self-end sm:col-start-5 sm:row-span-1 sm:row-start-auto"
      className={cn(isEntering && "fx-list-row-in", isExiting && "fx-list-row-out")}
      gridClassName="grid-cols-[minmax(0,1fr)_minmax(9ch,auto)_auto] grid-rows-[auto_auto] sm:grid-rows-none sm:grid-cols-[64px_minmax(0,1fr)_auto_auto_auto] sm:gap-x-200 sm:py-200 sm:[--fx-list-row-padding-y:var(--spacing-200)]"
      onSelect={() => onConversionSelect(conversion)}
      rowId={conversion.id}
      tabIndex={tabIndex}
    >
      <td
        className="col-start-1 row-start-1 block min-w-0 text-preset-4 text-neutral-200 drop-shadow-[0_4px_4px_rgb(0_0_0_/_0.25)] sm:col-start-1 sm:row-start-auto sm:w-[64px]"
        role="cell"
      >
        {formatRelativeTime(conversion.createdAt)}
      </td>
      <td
        className="col-start-1 row-start-2 block min-w-0 leading-0 sm:col-start-2 sm:row-start-auto"
        role="cell"
      >
        <span className="inline-flex min-w-0 items-center gap-100 text-preset-4 text-neutral-50 uppercase">
          <span>{conversion.fromCurrency}</span>
          <Icon decorative iconName="arrow-right" />
          <span>{conversion.toCurrency}</span>
        </span>
      </td>
      <td
        className="col-start-2 row-start-1 block min-w-0 self-end text-right text-preset-3 sm:col-start-3 sm:row-start-auto sm:self-auto"
        role="cell"
      >
        <span className="block truncate text-neutral-100">{sendAmount}</span>
      </td>
      <td
        className="col-start-2 row-start-2 block min-w-0 self-start text-right text-preset-3 text-lime-500 sm:col-start-4 sm:row-start-auto sm:self-auto"
        role="cell"
      >
        <span className="block truncate">{receiveAmount}</span>
      </td>
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
  const shouldAnimateConversionEntry = React.useCallback(
    ({
      currentKeys,
      item,
      previousItems,
    }: {
      currentKeys: Set<string>;
      item: Conversion;
      previousItems: Conversion[];
    }) => {
      return getReplacedOptimisticConversionKey({ currentKeys, item, previousItems }) === null;
    },
    []
  );
  const conversionTransitions = useTransitioningList({
    getEntryContinuationKey: getReplacedOptimisticConversionKey,
    getKey: getConversionMotionKey,
    items: conversions,
    shouldAnimateEntry: shouldAnimateConversionEntry,
  });
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
      receiveAmount: conversion.receiveAmount,
      searchParams: new URLSearchParams(searchParamsString),
      sendCurrency,
    });

    router.replace(nextUrl, { scroll: false });
    scrollConverterIntoViewIfNeeded();
  }

  function removeConversion(id: string) {
    if (conversionTransitions.exitingKeys.has(id)) {
      return;
    }

    const removedConversion = conversions.find((conversion) => conversion.id === id);

    conversionTransitions.startExit(id, () => {
      removeOptimisticConversion(id);
    });

    React.startTransition(async () => {
      try {
        await deleteConversion(id);
        router.refresh();
      } catch (error) {
        const removalPending = conversionTransitions.hasPendingExit(id);

        console.error("Failed to delete conversion", error);
        conversionTransitions.cancelExit(id);

        if (removedConversion && !removalPending) {
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

    previousConversions.forEach((conversion) => {
      conversionTransitions.startExit(conversion.id, () => {
        if (!conversionTransitions.hasPendingExits()) {
          clearOptimisticConversions();
        }
      });
    });

    React.startTransition(async () => {
      try {
        await deleteAllConversions();
        router.refresh();
      } catch (error) {
        const removalPending = conversionTransitions.hasPendingExits();

        console.error("Failed to clear conversions", error);
        conversionTransitions.cancelAllExits();

        if (!removalPending) {
          setConversionSnapshot(previousConversions);
        }

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
        className={conversionTransitions.isEmptyEntering ? "fx-state-in" : undefined}
        title="No conversions logged yet"
        lead={
          <>
            Every conversion is recorded here automatically when you tap LOG CONVERSION.
            <br className="hidden sm:inline" />{" "}
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
      className={cn("py-250", conversionTransitions.isListEntering && "fx-state-in")}
      countClassName="mt-[10px] w-full sm:mt-0 sm:w-auto"
      countSlot={
        <div className="flex items-center justify-between gap-200">
          <p className="text-preset-5 text-neutral-50 opacity-70">{conversions.length} Logged</p>
          <ConversionLogToolbar>
            <ClearButton
              aria-label="Export"
              data-conversion-log-toolbar-button
              disabled={conversions.length === 0}
              onClick={exportConversions}
              tabIndex={0}
            >
              Export
            </ClearButton>
            <ClearButton
              aria-label="Clear all"
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
            isEntering={conversionTransitions.enteringKeys.has(getConversionMotionKey(conversion))}
            isExiting={conversionTransitions.exitingKeys.has(conversion.id)}
            onConversionDelete={removeConversion}
            onConversionSelect={selectConversion}
            tabIndex={conversion.id === tabStopId ? 0 : -1}
          />
        ))}
      </RateDetailsTreeGrid>
    </RateDetailsList>
  );
}

function ConversionLogFallback() {
  return <TabPendingState label="Loading conversion log" />;
}

export { ConversionLog, ConversionLogFallback, formatRelativeTime, getConversionLogCsv };
