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
import { useCompareRatesPresentation } from "@/features/compare-rates";
import type { Conversion } from "@/features/conversion-log";
import { MoneyDecimal } from "@/features/converter/exchange";

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

function ConversionLog() {
  const { conversions, onConversionDelete, onConversionSelect, onConversionsClear } =
    useCompareRatesPresentation();
  const [preferredTabStopId, setPreferredTabStopId] = React.useState(conversions[0]?.id ?? "");
  const tabStopId = conversions.some((conversion) => conversion.id === preferredTabStopId)
    ? preferredTabStopId
    : (conversions[0]?.id ?? "");

  return (
    <RateDetailsList
      aria-label="Conversion log"
      className="py-250"
      countClassName="mt-[10px] w-full sm:mt-0 sm:w-auto"
      countSlot={
        <div className="flex items-center justify-between gap-200">
          <p className="text-preset-5 text-neutral-50 opacity-70">{conversions.length} Logged</p>
          <ClearButton
            aria-label="Clear all conversions"
            disabled={conversions.length === 0}
            onClick={onConversionsClear}
          />
        </div>
      }
      headerClassName="block pb-250 sm:flex sm:items-center sm:justify-between"
      headingId="conversion-log-heading"
      headingSlot={
        <span className="block text-preset-3-medium text-neutral-50">Conversion Log</span>
      }
    >
      {conversions.length > 0 ? (
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
              onConversionDelete={onConversionDelete}
              onConversionSelect={onConversionSelect}
              tabIndex={conversion.id === tabStopId ? 0 : -1}
            />
          ))}
        </RateDetailsTreeGrid>
      ) : (
        <p className="rounded-16 bg-neutral-600 px-150 py-200 text-preset-5 text-neutral-200 shadow-[inset_0_0_0_1px_hsl(var(--neutral-500))] sm:px-200">
          No conversions logged yet.
        </p>
      )}
    </RateDetailsList>
  );
}

export { ConversionLog, formatRelativeTime };
