"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { AmountInput, getAmountValue } from "@/components/ui/amount-input";
import { ExchangeButton } from "@/components/ui/exchange-button";
import type { FlagCountryCode } from "@/components/ui/flag";
import { LogConversionButton } from "@/components/ui/log-conversion-button";
import { useRovingTabIndex } from "@/components/ui/use-roving-tabindex";
import type { CreateConversionInput } from "@/features/conversion-log";
import type { Favorite } from "@/features/favorites";
import type { FrankfurterRate } from "@/lib/frankfurter";
import type { AvailableCurrency } from "../currencies";
import { convertAmount, getExchangeRate, MoneyDecimal, type AmountSide } from "../exchange";
import type { SelectedCurrency } from "./converter";
import { ConverterFavoriteButton } from "./converter-favorite-button";
import { CurrencyPicker } from "./currency-picker";
import { FavoriteButton } from "@/components/ui/favorite-button";

type ConverterAmountState = {
  amount: string;
  amountSource: AmountSide;
};

type ConverterAmountPanelProps = {
  amount: string;
  countryCode: FlagCountryCode;
  currencies: AvailableCurrency[];
  currencyCode: string;
  label: string;
  onAmountChange: (amount: string) => void;
  onCurrencyChange: (currency: SelectedCurrency) => void;
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
  countryCode,
  currencies,
  currencyCode,
  label,
  onAmountChange,
  onCurrencyChange,
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
            onAmountChange(event.currentTarget.value);
          }}
          value={amount}
          className={label === "Receive" ? "text-lime-500" : ""}
        />
        <CurrencyPicker
          aria-label={`Select ${label.toLowerCase()} currency`}
          countryCode={countryCode}
          currencies={currencies}
          currencyCode={currencyCode}
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
  const [{ amount, amountSource }, setAmountState] = usePersistedConverterAmount({
    initialAmount,
    initialAmountSource,
  });
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

  function updateSendAmount(nextAmount: string) {
    setAmountState({ amount: nextAmount, amountSource: "send" });
  }

  function updateReceiveAmount(nextAmount: string) {
    setAmountState({ amount: nextAmount, amountSource: "receive" });
  }

  function updateSendCurrency(currency: SelectedCurrency) {
    onSelectedCurrenciesChange({ sendCurrency: currency, receiveCurrency });
  }

  function updateReceiveCurrency(currency: SelectedCurrency) {
    onSelectedCurrenciesChange({ sendCurrency, receiveCurrency: currency });
  }

  function exchangeCurrencies() {
    onSelectedCurrenciesChange({
      sendCurrency: receiveCurrency,
      receiveCurrency: sendCurrency,
    });
  }

  return (
    <>
      <div className="flex flex-col gap-200 p-200 sm:flex-row sm:items-center sm:gap-300 sm:p-250">
        <ConverterAmountPanel
          {...sendCurrency}
          amount={sendAmount}
          currencies={currencies}
          label="Send"
          onAmountChange={updateSendAmount}
          onCurrencyChange={updateSendCurrency}
        />
        <ExchangeButton className="self-center" onClick={exchangeCurrencies} />
        <ConverterAmountPanel
          {...receiveCurrency}
          amount={receiveAmount}
          currencies={currencies}
          label="Receive"
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
                <FavoriteButton data-converter-action />
                <LogConversionButton data-converter-action disabled tabIndex={-1} />
              </>
            }
          >
            <ConverterFavoriteButton
              data-converter-action
              favoritesPromise={favoritesPromise}
              pair={{
                fromCurrency: sendCurrency.currencyCode,
                toCurrency: receiveCurrency.currencyCode,
              }}
              tabIndex={0}
            />
            <LogConversionButton
              aria-label={`Log ${sendAmount} ${sendCurrency.currencyCode} to ${receiveAmount} ${receiveCurrency.currencyCode}`}
              data-converter-action
              onClick={() => {
                onConversionLogCreate?.({
                  fromCurrency: sendCurrency.currencyCode,
                  receiveAmount,
                  sendAmount,
                  toCurrency: receiveCurrency.currencyCode,
                });
              }}
              disabled={!canLogConversion}
              tabIndex={-1}
            />
          </React.Suspense>
        </ConverterActionToolbar>
      </div>
    </>
  );
}

export { ConverterAmountControls, usePersistedConverterAmount };
