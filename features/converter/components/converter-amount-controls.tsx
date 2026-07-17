"use client";

import * as React from "react";

import { AmountInput, getAmountValue } from "@/components/ui/amount-input";
import { ExchangeButton } from "@/components/ui/exchange-button";
import {
  interactiveSurfaceClassName,
  interactiveSurfaceFocusOnNeutral700ClassName,
} from "@/components/ui/interactive-surface";
import { LogConversionButton } from "@/components/ui/log-conversion-button";
import { ShortcutTooltip } from "@/components/ui/shortcut-tooltip";
import type { CreateConversionInput } from "@/features/conversion-log/model/conversion-log";
import { useOptionalKeyboardShortcuts } from "@/features/keyboard-shortcuts";
import { cn } from "@/lib/utils";
import { usePersistedConverterAmount } from "../hooks/use-persisted-converter-amount";
import type { AvailableCurrency } from "../model/currencies";
import {
  convertAmount,
  getConverterExchangeRate,
  MoneyDecimal,
  type AmountSide,
  type ConverterRates,
} from "../model/exchange";
import type { SelectedCurrency } from "../model/selected-currency";
import { ConverterFavoritePairProvider } from "./converter-favorite-button";
import {
  CurrencyPickerWithData,
  type CurrencyPickerHandle,
  type CurrencyPickerWithDataProps,
} from "./currency-picker";

type ConverterAmountPanelProps = {
  amount: string;
  amountSide: AmountSide;
  countryCode?: SelectedCurrency["countryCode"];
  currencyReferencePromise: Promise<AvailableCurrency[]>;
  currencyCode: string;
  label: string;
  pickerRef: React.Ref<CurrencyPickerHandle>;
  onAmountChange: (amount: string) => void;
  onCurrencyChange: (currency: SelectedCurrency) => void;
  onInteraction: (side: AmountSide) => void;
};

type DeferredCurrencyPickerProps = Omit<CurrencyPickerWithDataProps, "currenciesPromise"> & {
  currenciesPromise: Promise<AvailableCurrency[]>;
};

type ConverterAmountControlsProps = {
  currencyReferencePromise: Promise<AvailableCurrency[]>;
  exchangeRateLabel: string;
  favoriteButtonSlot: React.ReactNode;
  initialAmount?: string;
  initialAmountSource?: AmountSide;
  initialReceiveAmount?: string;
  rates: ConverterRates;
  receiveCurrency: SelectedCurrency;
  sendCurrency: SelectedCurrency;
  onConversionLogCreate?: (conversion: CreateConversionInput) => void;
  onSelectedCurrenciesChange: (currencies: {
    receiveCurrency: SelectedCurrency;
    sendCurrency: SelectedCurrency;
  }) => void;
};

const logConversionAcknowledgementMs = 700;

function DeferredCurrencyPicker({
  className,
  currenciesPromise,
  countryCode,
  currencyCode,
  flagFetchPriority,
  flagLoading,
  onPickerOpen,
  onCurrencySelect,
  left,
  ref,
}: DeferredCurrencyPickerProps) {
  return (
    <CurrencyPickerWithData
      ref={ref}
      className={className}
      countryCode={countryCode}
      currenciesPromise={currenciesPromise}
      currencyCode={currencyCode}
      flagFetchPriority={flagFetchPriority}
      flagLoading={flagLoading}
      left={left}
      onCurrencySelect={onCurrencySelect}
      onPickerOpen={onPickerOpen}
    />
  );
}

function isPositiveAmount(amount: string) {
  try {
    return new MoneyDecimal(getAmountValue(amount)).gt(0);
  } catch {
    return false;
  }
}

function ConverterAmountPanel({
  amount,
  amountSide,
  countryCode,
  currencyReferencePromise,
  currencyCode,
  label,
  pickerRef,
  onAmountChange,
  onCurrencyChange,
  onInteraction,
}: ConverterAmountPanelProps) {
  return (
    <fieldset className="m-0 flex min-w-0 flex-col justify-between rounded-16 border-0 bg-neutral-600 p-200 shadow-[inset_0_0_0_1px_hsl(var(--neutral-500))] [min-inline-size:0] sm:flex-1 sm:p-250">
      <legend className="sr-only">{label}</legend>
      <span aria-hidden="true" className="mb-250 text-preset-4 text-neutral-100 uppercase">
        {label}
      </span>
      <div className="flex items-end justify-between gap-200">
        <AmountInput
          aria-label="Amount"
          onBlur={(event) => {
            const normalizedAmount = getAmountValue(event.currentTarget.value).replace(/\.$/, "");
            const currentAmount = amount.endsWith(".")
              ? amount
              : getAmountValue(amount).replace(/\.$/, "");

            if (normalizedAmount !== currentAmount) {
              onAmountChange(normalizedAmount);
            }
          }}
          onChange={(event) => {
            onInteraction(amountSide);
            onAmountChange(event.currentTarget.value);
          }}
          value={amount}
          className={label === "Receive" ? "text-lime-500" : ""}
        />
        {countryCode ? (
          <React.Suspense fallback={<CurrencyPickerFallback currencyCode={currencyCode} />}>
            <DeferredCurrencyPicker
              countryCode={countryCode}
              currenciesPromise={currencyReferencePromise}
              currencyCode={currencyCode}
              flagFetchPriority="high"
              flagLoading="eager"
              onPickerOpen={() => {
                onInteraction(amountSide);
              }}
              onCurrencySelect={(currency) => {
                onCurrencyChange({
                  countryCode: currency.countryCode,
                  currencyCode: currency.code,
                });
              }}
              ref={pickerRef}
              left={label === "Send"}
            />
          </React.Suspense>
        ) : (
          <CurrencyPickerFallback currencyCode={currencyCode} />
        )}
      </div>
    </fieldset>
  );
}

function CurrencyPickerFallback({ currencyCode }: { currencyCode: string }) {
  return (
    <button
      aria-label={currencyCode}
      className={cn(
        interactiveSurfaceClassName,
        "h-500 w-1200 p-125 text-preset-4 text-neutral-50 uppercase"
      )}
      disabled
      tabIndex={-1}
      type="button"
    >
      <span aria-hidden="true" className="fx-skeleton fx-skeleton-control size-250 rounded-full" />
      <span>{currencyCode}</span>
      <span aria-hidden="true" className="fx-skeleton fx-skeleton-control size-150 rounded-4" />
    </button>
  );
}

function ConverterActionGroup({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-200 flex flex-wrap justify-center gap-100 sm:mt-0 sm:justify-end">
      {children}
    </div>
  );
}

function FavoriteButtonFallback() {
  return (
    <button
      aria-label="Loading favorite state"
      className={cn(
        interactiveSurfaceClassName,
        interactiveSurfaceFocusOnNeutral700ClassName,
        "px-150 py-100"
      )}
      disabled
      type="button"
    >
      <span aria-hidden="true" className="fx-skeleton fx-skeleton-control size-200 rounded-4" />
      <span
        aria-hidden="true"
        className="fx-skeleton fx-skeleton-control h-[15px] w-[62px] rounded-4"
      />
    </button>
  );
}

function ConverterAmountControls({
  currencyReferencePromise,
  exchangeRateLabel,
  favoriteButtonSlot,
  initialAmount,
  initialAmountSource,
  initialReceiveAmount,
  rates,
  receiveCurrency,
  sendCurrency,
  onConversionLogCreate,
  onSelectedCurrenciesChange,
}: ConverterAmountControlsProps) {
  const shortcuts = useOptionalKeyboardShortcuts();
  const sendPickerRef = React.useRef<CurrencyPickerHandle>(null);
  const receivePickerRef = React.useRef<CurrencyPickerHandle>(null);
  const [lastInteractedSide, setLastInteractedSide] = React.useState<AmountSide>("send");
  const [amountState, setAmountState] = usePersistedConverterAmount({
    initialAmount,
    initialAmountSource,
    initialReceiveAmount,
  });
  const { amount, amountSource } = amountState;
  const [isLogAcknowledged, setIsLogAcknowledged] = React.useState(false);
  const logAcknowledgementTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const exchangeRate = getConverterExchangeRate(
    rates,
    sendCurrency.currencyCode,
    receiveCurrency.currencyCode
  );
  const inverseExchangeRate = exchangeRate === null ? null : new MoneyDecimal(1).div(exchangeRate);
  const sendAmount = amountSource === "send" ? amount : convertAmount(amount, inverseExchangeRate);
  const receiveAmount =
    amountSource === "receive"
      ? amount
      : (amountState.receiveAmount ?? convertAmount(amount, exchangeRate));
  const canLogConversion =
    exchangeRate !== null && isPositiveAmount(sendAmount) && isPositiveAmount(receiveAmount);

  function clearLogAcknowledgement() {
    if (logAcknowledgementTimeoutRef.current) {
      clearTimeout(logAcknowledgementTimeoutRef.current);
      logAcknowledgementTimeoutRef.current = null;
    }

    setIsLogAcknowledged(false);
  }

  function acknowledgeLoggedConversion() {
    if (logAcknowledgementTimeoutRef.current) {
      clearTimeout(logAcknowledgementTimeoutRef.current);
    }

    setIsLogAcknowledged(true);
    logAcknowledgementTimeoutRef.current = setTimeout(() => {
      logAcknowledgementTimeoutRef.current = null;
      setIsLogAcknowledged(false);
    }, logConversionAcknowledgementMs);
  }

  React.useEffect(() => {
    return () => {
      if (logAcknowledgementTimeoutRef.current) {
        clearTimeout(logAcknowledgementTimeoutRef.current);
      }
    };
  }, []);

  function updateSendAmount(nextAmount: string) {
    clearLogAcknowledgement();
    setAmountState({ amount: nextAmount, amountSource: "send" });
  }

  function updateReceiveAmount(nextAmount: string) {
    clearLogAcknowledgement();
    setAmountState({ amount: nextAmount, amountSource: "receive" });
  }

  function updateSendCurrency(currency: SelectedCurrency) {
    clearLogAcknowledgement();
    onSelectedCurrenciesChange({ sendCurrency: currency, receiveCurrency });
    requestAnimationFrame(() => {
      sendPickerRef.current?.focusTrigger();
    });
  }

  function updateReceiveCurrency(currency: SelectedCurrency) {
    clearLogAcknowledgement();
    onSelectedCurrenciesChange({ sendCurrency, receiveCurrency: currency });
    requestAnimationFrame(() => {
      receivePickerRef.current?.focusTrigger();
    });
  }

  const exchangeCurrencies = React.useCallback(() => {
    clearLogAcknowledgement();
    onSelectedCurrenciesChange({
      sendCurrency: receiveCurrency,
      receiveCurrency: sendCurrency,
    });
  }, [onSelectedCurrenciesChange, receiveCurrency, sendCurrency]);

  React.useEffect(() => {
    shortcuts?.registerFocusCurrencySearch(() => {
      const pickerRef = lastInteractedSide === "send" ? sendPickerRef : receivePickerRef;

      pickerRef.current?.openAndFocusSearch();
    });
    shortcuts?.registerSwapCurrencies(exchangeCurrencies);

    return () => {
      shortcuts?.registerFocusCurrencySearch(null);
      shortcuts?.registerSwapCurrencies(null);
    };
  }, [exchangeCurrencies, lastInteractedSide, shortcuts]);

  return (
    <>
      <div className="flex flex-col gap-200 p-200 sm:flex-row sm:items-center sm:gap-300 sm:p-250">
        <ConverterAmountPanel
          {...sendCurrency}
          amount={sendAmount}
          amountSide="send"
          currencyReferencePromise={currencyReferencePromise}
          label="Send"
          pickerRef={sendPickerRef}
          onInteraction={setLastInteractedSide}
          onAmountChange={updateSendAmount}
          onCurrencyChange={updateSendCurrency}
        />
        <ShortcutTooltip
          className="self-center"
          label="Swap currencies"
          shortcut={shortcuts?.formatShortcut({ key: "X" }) ?? "X"}
        >
          <ExchangeButton onClick={exchangeCurrencies} />
        </ShortcutTooltip>
        <ConverterAmountPanel
          {...receiveCurrency}
          amount={receiveAmount}
          amountSide="receive"
          currencyReferencePromise={currencyReferencePromise}
          label="Receive"
          pickerRef={receivePickerRef}
          onInteraction={setLastInteractedSide}
          onAmountChange={updateReceiveAmount}
          onCurrencyChange={updateReceiveCurrency}
        />
      </div>
      <svg width="100%" height="1">
        <line
          x1="0"
          y1="0"
          x2="100%"
          y2="0"
          className="stroke-neutral-500"
          strokeWidth="1"
          strokeDasharray="4 4"
        />
      </svg>
      <div className="p-200 sm:flex sm:items-center sm:justify-between sm:px-250">
        <p
          className="text-center text-preset-6 text-neutral-50 sm:text-left sm:text-preset-5"
          aria-live="polite"
          aria-atomic="true"
        >
          {exchangeRateLabel}
        </p>
        <ConverterActionGroup>
          <ConverterFavoritePairProvider
            pair={{
              fromCurrency: sendCurrency.currencyCode,
              toCurrency: receiveCurrency.currencyCode,
            }}
          >
            <React.Suspense fallback={<FavoriteButtonFallback />}>
              {favoriteButtonSlot}
            </React.Suspense>
          </ConverterFavoritePairProvider>
          <LogConversionButton
            aria-disabled={isLogAcknowledged ? true : undefined}
            aria-label={
              isLogAcknowledged
                ? `Logged ${sendAmount} ${sendCurrency.currencyCode} to ${receiveAmount} ${receiveCurrency.currencyCode}`
                : `Log ${sendAmount} ${sendCurrency.currencyCode} to ${receiveAmount} ${receiveCurrency.currencyCode}`
            }
            onClick={() => {
              if (isLogAcknowledged || !canLogConversion) {
                return;
              }

              acknowledgeLoggedConversion();
              onConversionLogCreate?.({
                fromCurrency: sendCurrency.currencyCode,
                receiveAmount,
                sendAmount,
                toCurrency: receiveCurrency.currencyCode,
              });
            }}
            disabled={!canLogConversion}
            pressed={isLogAcknowledged}
          />
        </ConverterActionGroup>
      </div>
    </>
  );
}

export { ConverterAmountControls, FavoriteButtonFallback };
