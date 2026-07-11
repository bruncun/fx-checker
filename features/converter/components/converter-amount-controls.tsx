"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { AmountInput, getAmountValue } from "@/components/ui/amount-input";
import { CurrencyButton } from "@/components/ui/currency-button";
import { ExchangeButton } from "@/components/ui/exchange-button";
import type { FlagCountryCode } from "@/components/ui/flag";
import {
  interactiveSurfaceClassName,
  interactiveSurfaceFocusOnNeutral700ClassName,
} from "@/components/ui/interactive-surface";
import { LogConversionButton } from "@/components/ui/log-conversion-button";
import { ShortcutTooltip } from "@/components/ui/shortcut-tooltip";
import { useRovingTabIndex } from "@/hooks/use-roving-tabindex";
import type { CreateConversionInput } from "@/features/conversion-log";
import type { Favorite } from "@/features/favorites";
import { useOptionalKeyboardShortcuts } from "@/features/keyboard-shortcuts";
import type { FrankfurterRate } from "@/lib/frankfurter";
import { cn } from "@/lib/utils";
import type { AvailableCurrency } from "../model/currencies";
import { convertAmount, getExchangeRate, MoneyDecimal, type AmountSide } from "../model/exchange";
import type { SelectedCurrency } from "./converter";
import type { CurrencyPickerHandle, CurrencyPickerProps } from "./currency-picker";

type ConverterAmountState = {
  amount: string;
  amountSource: AmountSide;
};

type ConverterAmountPanelProps = {
  amount: string;
  amountSide: AmountSide;
  countryCode: FlagCountryCode;
  currencies: AvailableCurrency[];
  currencyCode: string;
  focusSearchRequest: number;
  label: string;
  onAmountChange: (amount: string) => void;
  onCurrencyChange: (currency: SelectedCurrency) => void;
  onInteraction: (side: AmountSide) => void;
};

type DeferredCurrencyPickerProps = CurrencyPickerProps & {
  focusSearchRequest: number;
};

type ConverterAmountControlsProps = {
  currencies: AvailableCurrency[];
  exchangeRateLabel: string;
  favoritesPromise: Promise<Favorite[]>;
  initialAmount?: string;
  initialAmountSource?: AmountSide;
  rates: FrankfurterRate[];
  receiveCurrency: SelectedCurrency;
  sendCurrency: SelectedCurrency;
  onConversionLogCreate?: (conversion: CreateConversionInput) => void;
  onSelectedCurrenciesChange: (currencies: {
    receiveCurrency: SelectedCurrency;
    sendCurrency: SelectedCurrency;
  }) => void;
};

const logConversionAcknowledgementMs = 700;

const LazyCurrencyPicker = React.lazy(async () => ({
  default: (await import("./currency-picker")).CurrencyPicker,
})) as React.LazyExoticComponent<(props: CurrencyPickerProps) => React.ReactNode>;

const LazyConverterFavoriteButton = React.lazy(async () => ({
  default: (await import("./converter-favorite-button")).ConverterFavoriteButton,
}));

function DeferredCurrencyPicker({
  focusSearchRequest,
  onPickerOpen,
  ...props
}: DeferredCurrencyPickerProps) {
  const pickerRef = React.useRef<CurrencyPickerHandle>(null);
  const [shouldRenderPicker, setShouldRenderPicker] = React.useState(false);
  const [shouldFocusSearch, setShouldFocusSearch] = React.useState(false);

  function loadAndFocusPicker() {
    setShouldRenderPicker(true);
    setShouldFocusSearch(true);
  }

  React.useEffect(() => {
    if (!shouldFocusSearch) {
      return;
    }

    let isCancelled = false;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    function focusWhenReady() {
      if (isCancelled) {
        return;
      }

      if (pickerRef.current) {
        pickerRef.current.focusSearch();
        setShouldFocusSearch(false);
        return;
      }

      timeoutId = setTimeout(focusWhenReady, 16);
    }

    focusWhenReady();

    return () => {
      isCancelled = true;

      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [shouldFocusSearch]);

  React.useEffect(() => {
    if (focusSearchRequest === 0) {
      return;
    }

    const timeoutId = setTimeout(loadAndFocusPicker, 0);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [focusSearchRequest]);

  const fallback = (
    <CurrencyButton
      aria-expanded={false}
      aria-haspopup="dialog"
      aria-label={props["aria-label"]}
      countryCode={props.countryCode}
      currencyCode={props.currencyCode}
      onClick={() => {
        onPickerOpen?.();
        loadAndFocusPicker();
      }}
      onKeyDown={(event) => {
        if (
          event.key !== "ArrowDown" &&
          event.key !== "Enter" &&
          event.key !== " " &&
          event.key !== "Spacebar"
        ) {
          return;
        }

        event.preventDefault();
        onPickerOpen?.();
        loadAndFocusPicker();
      }}
    />
  );

  if (!shouldRenderPicker) {
    return fallback;
  }

  return (
    <React.Suspense fallback={fallback}>
      <LazyCurrencyPicker {...props} ref={pickerRef} onPickerOpen={onPickerOpen} />
    </React.Suspense>
  );
}

function isPositiveAmount(amount: string) {
  try {
    return new MoneyDecimal(getAmountValue(amount)).gt(0);
  } catch {
    return false;
  }
}

function usePersistedConverterAmount({
  initialAmount,
  initialAmountSource,
}: {
  initialAmount?: string;
  initialAmountSource?: AmountSide;
}) {
  const pathname = usePathname() ?? "/";
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchParamsString = searchParams.toString();
  const [amountState, setAmountState] = React.useState<ConverterAmountState>({
    amount: initialAmount ?? "",
    amountSource: initialAmountSource ?? "send",
  });
  const hasMountedRef = React.useRef(false);

  React.useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }

    const nextSearchParams = new URLSearchParams(searchParamsString);
    const currentAmount = nextSearchParams.has("amount")
      ? (nextSearchParams.get("amount") ?? "")
      : null;
    const currentAmountSource = nextSearchParams.get("amountSource") ?? "send";

    if (currentAmount === amountState.amount && currentAmountSource === amountState.amountSource) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      if (window.location.pathname !== pathname) {
        return;
      }

      nextSearchParams.set("amount", amountState.amount);
      nextSearchParams.set("amountSource", amountState.amountSource);

      const queryString = nextSearchParams.toString();
      const nextUrl = queryString ? `${pathname}?${queryString}` : pathname;
      const currentUrl = searchParamsString ? `${pathname}?${searchParamsString}` : pathname;

      if (nextUrl !== currentUrl) {
        router.replace(nextUrl, { scroll: false });
      }
    }, 50);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [amountState, pathname, router, searchParamsString]);

  return [amountState, setAmountState] as const;
}

function ConverterAmountPanel({
  amount,
  amountSide,
  countryCode,
  currencies,
  currencyCode,
  focusSearchRequest,
  label,
  onAmountChange,
  onCurrencyChange,
  onInteraction,
}: ConverterAmountPanelProps) {
  return (
    <section className="flex flex-col justify-between rounded-16 bg-neutral-600 p-200 shadow-[inset_0_0_0_1px_hsl(var(--neutral-500))] sm:min-w-0 sm:flex-1 sm:p-250">
      <h2 className="mb-250 text-preset-4 text-neutral-100 uppercase">{label}</h2>
      <div className="flex items-end justify-between gap-200">
        <AmountInput
          aria-label={`${label} amount`}
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
        <DeferredCurrencyPicker
          aria-label={`Select ${label.toLowerCase()} currency`}
          countryCode={countryCode}
          currencies={currencies}
          currencyCode={currencyCode}
          flagFetchPriority="high"
          flagLoading="eager"
          focusSearchRequest={focusSearchRequest}
          onPickerOpen={() => {
            onInteraction(amountSide);
          }}
          onCurrencySelect={(currency) => {
            onCurrencyChange({
              countryCode: currency.countryCode,
              currencyCode: currency.code,
            });
          }}
          left={label === "Send"}
        />
      </div>
    </section>
  );
}

function ConverterActionToolbar({ children }: { children: React.ReactNode }) {
  const toolbarRef = React.useRef<HTMLDivElement>(null);
  const rovingFocus = useRovingTabIndex<HTMLButtonElement>({
    containerRef: toolbarRef,
    itemSelector: "[data-converter-action]:not(:disabled)",
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
      aria-label="Conversion actions"
      className="mt-200 flex flex-wrap justify-center gap-100 sm:mt-0 sm:justify-end"
      onKeyDown={rovingFocus.handleKeyDown}
      role="toolbar"
    >
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
      data-converter-action
      disabled
      tabIndex={-1}
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
  currencies,
  exchangeRateLabel,
  favoritesPromise,
  initialAmount,
  initialAmountSource,
  rates,
  receiveCurrency,
  sendCurrency,
  onConversionLogCreate,
  onSelectedCurrenciesChange,
}: ConverterAmountControlsProps) {
  const shortcuts = useOptionalKeyboardShortcuts();
  const [focusSearchRequests, setFocusSearchRequests] = React.useState({
    receive: 0,
    send: 0,
  });
  const [lastInteractedSide, setLastInteractedSide] = React.useState<AmountSide>("send");
  const [{ amount, amountSource }, setAmountState] = usePersistedConverterAmount({
    initialAmount,
    initialAmountSource,
  });
  const [isLogAcknowledged, setIsLogAcknowledged] = React.useState(false);
  const logAcknowledgementTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const exchangeRate = getExchangeRate(
    rates,
    sendCurrency.currencyCode,
    receiveCurrency.currencyCode
  );
  const inverseExchangeRate = exchangeRate === null ? null : new MoneyDecimal(1).div(exchangeRate);
  const sendAmount = amountSource === "send" ? amount : convertAmount(amount, inverseExchangeRate);
  const receiveAmount = amountSource === "receive" ? amount : convertAmount(amount, exchangeRate);
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
  }

  function updateReceiveCurrency(currency: SelectedCurrency) {
    clearLogAcknowledgement();
    onSelectedCurrenciesChange({ sendCurrency, receiveCurrency: currency });
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
      setFocusSearchRequests((requests) => ({
        ...requests,
        [lastInteractedSide]: requests[lastInteractedSide] + 1,
      }));
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
          currencies={currencies}
          focusSearchRequest={focusSearchRequests.send}
          label="Send"
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
          currencies={currencies}
          focusSearchRequest={focusSearchRequests.receive}
          label="Receive"
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
        <ConverterActionToolbar>
          <React.Suspense
            fallback={
              <>
                <FavoriteButtonFallback />
                <LogConversionButton data-converter-action disabled tabIndex={-1} />
              </>
            }
          >
            <LazyConverterFavoriteButton
              data-converter-action
              favoritesPromise={favoritesPromise}
              pair={{
                fromCurrency: sendCurrency.currencyCode,
                toCurrency: receiveCurrency.currencyCode,
              }}
              tabIndex={0}
            />
            <LogConversionButton
              aria-disabled={isLogAcknowledged ? true : undefined}
              aria-label={
                isLogAcknowledged
                  ? `Logged ${sendAmount} ${sendCurrency.currencyCode} to ${receiveAmount} ${receiveCurrency.currencyCode}`
                  : `Log ${sendAmount} ${sendCurrency.currencyCode} to ${receiveAmount} ${receiveCurrency.currencyCode}`
              }
              data-converter-action
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
              tabIndex={-1}
            />
          </React.Suspense>
        </ConverterActionToolbar>
      </div>
    </>
  );
}

export { ConverterAmountControls, usePersistedConverterAmount, FavoriteButtonFallback };
