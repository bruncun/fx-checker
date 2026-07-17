"use client";

import * as React from "react";

import type { AvailableCurrency } from "../model/currencies";
import type { CurrencyPickerItem } from "../model/currency-groups";
import type { CurrencyPickerContentProps } from "./currency-picker-content";
import { CurrencyPickerShell, type CurrencyPickerShellProps } from "./currency-picker-shell";

type DeferredCurrencyPickerProps = Omit<
  CurrencyPickerShellProps,
  "onCurrencySelect" | "onPrepare" | "renderContent"
> & {
  onCurrencySelect?: (currency: CurrencyPickerItem) => void;
};

let currencyPickerContentPromise: Promise<typeof import("./currency-picker-content")> | null = null;
let currencyReferencePromise: Promise<AvailableCurrency[]> | null = null;

function loadCurrencyPickerContent() {
  currencyPickerContentPromise ??= import("./currency-picker-content");

  return currencyPickerContentPromise;
}

const LazyCurrencyPickerContent = React.lazy(async () => {
  const pickerContent = await loadCurrencyPickerContent();

  return { default: pickerContent.CurrencyPickerContent };
});

async function fetchCurrencyReference() {
  const response = await fetch("/api/currencies");

  if (!response.ok) {
    throw new Error("Failed to load currencies");
  }

  const data = (await response.json()) as { availableCurrencies?: AvailableCurrency[] };

  if (!Array.isArray(data.availableCurrencies)) {
    throw new Error("Currency response is invalid");
  }

  return data.availableCurrencies;
}

function loadCurrencyReference() {
  currencyReferencePromise ??= fetchCurrencyReference().catch((error: unknown) => {
    currencyReferencePromise = null;
    console.error("Failed to prepare currency picker", error);
    return [];
  });

  return currencyReferencePromise;
}

function prepareCurrencyPicker() {
  void loadCurrencyPickerContent();
  void loadCurrencyReference();
}

function CurrencyPickerContentWithData(props: Omit<CurrencyPickerContentProps, "currencies">) {
  const currencies = React.use(loadCurrencyReference());

  return <LazyCurrencyPickerContent {...props} currencies={currencies} />;
}

function CurrencyPickerContentFallback() {
  return (
    <div className="flex min-h-[230px] flex-1 flex-col gap-100 overflow-hidden px-200 py-100 sm:min-h-[390px]">
      {Array.from({ length: 6 }, (_, index) => (
        <div
          aria-hidden="true"
          className="fx-skeleton fx-skeleton-control h-500 shrink-0 rounded-8"
          key={index}
        />
      ))}
    </div>
  );
}

function DeferredCurrencyPicker(props: DeferredCurrencyPickerProps) {
  return (
    <CurrencyPickerShell
      {...props}
      onPrepare={prepareCurrencyPicker}
      renderContent={(contentProps) => (
        <React.Suspense fallback={<CurrencyPickerContentFallback />}>
          <CurrencyPickerContentWithData {...contentProps} ref={contentProps.contentRef} />
        </React.Suspense>
      )}
    />
  );
}

export { DeferredCurrencyPicker, prepareCurrencyPicker };
