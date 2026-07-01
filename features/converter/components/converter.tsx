"use client";

import * as React from "react";

import { AmountInput, getAmountValue } from "@/components/ui/amount-input";
import { ExchangeButton } from "@/components/ui/exchange-button";
import { FavoriteButton } from "@/components/ui/favorite-button";
import type { FlagCountryCode } from "@/components/ui/flag";
import { LogConversionButton } from "@/components/ui/log-conversion-button";
import type { FrankfurterRate } from "@/lib/frankfurter";
import type { AvailableCurrency } from "../currencies";
import { convertAmount, getExchangeRate, formatExchangeRate, MoneyDecimal } from "../exchange";
import type { AmountSide } from "../exchange";
import { CurrencyPicker } from "./currency-picker";

export type SelectedCurrency = {
  countryCode: FlagCountryCode;
  currencyCode: string;
};

type ConverterProps = {
  amount?: string;
  amountSource?: AmountSide;
  currencies: AvailableCurrency[];
  receiveCurrency: SelectedCurrency;
  rates: FrankfurterRate[];
  sendCurrency: SelectedCurrency;
  onAmountChange?: (value: { amount: string; amountSource: AmountSide }) => void;
  onSelectedCurrenciesChange: (currencies: {
    receiveCurrency: SelectedCurrency;
    sendCurrency: SelectedCurrency;
  }) => void;
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

function Converter({
  amount: controlledAmount,
  amountSource: controlledAmountSource,
  currencies,
  receiveCurrency,
  rates,
  sendCurrency,
  onAmountChange,
  onSelectedCurrenciesChange,
}: ConverterProps) {
  const [internalAmount, setInternalAmount] = React.useState("");
  const [internalAmountSource, setInternalAmountSource] = React.useState<AmountSide>("send");
  const amount = controlledAmount ?? internalAmount;
  const amountSource = controlledAmountSource ?? internalAmountSource;
  const exchangeRate = getExchangeRate(
    rates,
    sendCurrency.currencyCode,
    receiveCurrency.currencyCode
  );
  const inverseExchangeRate = exchangeRate === null ? null : new MoneyDecimal(1).div(exchangeRate);
  const sendAmount = amountSource === "send" ? amount : convertAmount(amount, inverseExchangeRate);
  const receiveAmount = amountSource === "receive" ? amount : convertAmount(amount, exchangeRate);

  function updateAmount(value: { amount: string; amountSource: AmountSide }) {
    onAmountChange?.(value);

    if (controlledAmount === undefined) {
      setInternalAmount(value.amount);
    }

    if (controlledAmountSource === undefined) {
      setInternalAmountSource(value.amountSource);
    }
  }

  function updateSendAmount(nextAmount: string) {
    updateAmount({ amount: nextAmount, amountSource: "send" });
  }

  function updateReceiveAmount(nextAmount: string) {
    updateAmount({ amount: nextAmount, amountSource: "receive" });
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
    <section aria-labelledby="converter-heading">
      <h1 id="converter-heading" className="mb-200 text-preset-2 text-neutral-50 uppercase">
        Check the Rate
      </h1>
      <div className="rounded-20 bg-neutral-700 shadow-[0_12px_40px_0_rgb(0_0_0_/_0.4)]">
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
            {exchangeRate === null
              ? `Rate unavailable for ${sendCurrency.currencyCode}/${receiveCurrency.currencyCode}`
              : `1 ${sendCurrency.currencyCode} = ${formatExchangeRate(exchangeRate)} ${receiveCurrency.currencyCode}`}
          </p>
          <div className="mt-200 flex flex-wrap justify-center gap-100 sm:mt-0 sm:justify-end">
            <FavoriteButton disabled />
            <LogConversionButton disabled />
          </div>
        </div>
      </div>
    </section>
  );
}

export { Converter };
