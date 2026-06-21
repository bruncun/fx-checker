"use client";

import * as React from "react";
import Decimal from "decimal.js";

import { AmountInput, getAmountValue } from "@/components/ui/amount-input";
import { ExchangeButton } from "@/components/ui/exchange-button";
import { FavoriteButton } from "@/components/ui/favorite-button";
import type { FlagCountryCode } from "@/components/ui/flag";
import { LogConversionButton } from "@/components/ui/log-conversion-button";
import type { FrankfurterRate } from "@/lib/frankfurter";
import type { AvailableCurrency } from "../currencies";
import { CurrencyPicker } from "./currency-picker";

type SelectedCurrency = {
  countryCode: FlagCountryCode;
  currencyCode: string;
};

type AmountSide = "send" | "receive";

type ConverterProps = {
  currencies: AvailableCurrency[];
  rates: FrankfurterRate[];
};

const MoneyDecimal = Decimal.clone({ precision: 40 });

function getExchangeRate(rates: FrankfurterRate[], base: string, quote: string) {
  if (base === quote) {
    return new MoneyDecimal(1);
  }

  const sharedBase = rates[0]?.base;
  if (!sharedBase || rates.some((rate) => rate.base !== sharedBase)) {
    return null;
  }

  const rateByQuote = new Map(rates.map((rate) => [rate.quote, new MoneyDecimal(rate.rate)]));
  const baseRate = base === sharedBase ? new MoneyDecimal(1) : rateByQuote.get(base);
  const quoteRate = quote === sharedBase ? new MoneyDecimal(1) : rateByQuote.get(quote);

  if (baseRate === undefined || quoteRate === undefined) {
    return null;
  }

  return quoteRate.div(baseRate);
}

function formatExchangeRate(rate: Decimal) {
  if (rate.lt(0.0001)) {
    return rate.toSignificantDigits(4).toFixed();
  }

  return rate.toDecimalPlaces(4).toFixed(4);
}

function getConvertedAmountDecimalPlaces(amount: Decimal) {
  const absoluteAmount = amount.abs();

  if (absoluteAmount.isZero() || absoluteAmount.gte(0.01)) {
    return 2;
  }

  const magnitude = absoluteAmount.e;

  return Math.min(8, 3 - magnitude);
}

function convertAmount(amount: string, rate: Decimal | null) {
  if (amount === "" || rate === null) {
    return "";
  }

  let numericAmount: Decimal;

  try {
    numericAmount = new MoneyDecimal(amount);
  } catch {
    return "";
  }

  const convertedAmount = numericAmount.mul(rate);
  const decimalPlaces = getConvertedAmountDecimalPlaces(convertedAmount);

  return convertedAmount.toDecimalPlaces(decimalPlaces).toFixed();
}

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

            if (normalizedAmount !== amount) {
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

function Converter({ currencies, rates }: ConverterProps) {
  const defaultSendCurrency =
    currencies.find((currency) => currency.code === "USD") ?? currencies[0];
  const defaultReceiveCurrency =
    currencies.find(
      (currency) => currency.code === "EUR" && currency.code !== defaultSendCurrency.code
    ) ??
    currencies.find((currency) => currency.code !== defaultSendCurrency.code) ??
    defaultSendCurrency;
  const [sendAmount, setSendAmount] = React.useState("");
  const [receiveAmount, setReceiveAmount] = React.useState("");
  const [sendCurrency, setSendCurrency] = React.useState<SelectedCurrency>({
    countryCode: defaultSendCurrency.countryCode,
    currencyCode: defaultSendCurrency.code,
  });
  const [receiveCurrency, setReceiveCurrency] = React.useState<SelectedCurrency>({
    countryCode: defaultReceiveCurrency.countryCode,
    currencyCode: defaultReceiveCurrency.code,
  });
  const amountSource = React.useRef<AmountSide>("send");
  const exchangeRate = getExchangeRate(
    rates,
    sendCurrency.currencyCode,
    receiveCurrency.currencyCode
  );

  function updateSendAmount(amount: string) {
    amountSource.current = "send";
    setSendAmount(amount);
    setReceiveAmount(convertAmount(amount, exchangeRate));
  }

  function updateReceiveAmount(amount: string) {
    amountSource.current = "receive";
    setReceiveAmount(amount);
    setSendAmount(
      convertAmount(amount, exchangeRate === null ? null : new MoneyDecimal(1).div(exchangeRate))
    );
  }

  function updateSendCurrency(currency: SelectedCurrency) {
    const nextRate = getExchangeRate(rates, currency.currencyCode, receiveCurrency.currencyCode);

    setSendCurrency(currency);

    if (amountSource.current === "send") {
      setReceiveAmount(convertAmount(sendAmount, nextRate));
    } else {
      setSendAmount(
        convertAmount(receiveAmount, nextRate === null ? null : new MoneyDecimal(1).div(nextRate))
      );
    }
  }

  function updateReceiveCurrency(currency: SelectedCurrency) {
    const nextRate = getExchangeRate(rates, sendCurrency.currencyCode, currency.currencyCode);

    setReceiveCurrency(currency);

    if (amountSource.current === "send") {
      setReceiveAmount(convertAmount(sendAmount, nextRate));
    } else {
      setSendAmount(
        convertAmount(receiveAmount, nextRate === null ? null : new MoneyDecimal(1).div(nextRate))
      );
    }
  }

  function exchangeCurrencies() {
    setSendCurrency(receiveCurrency);
    setReceiveCurrency(sendCurrency);
    setSendAmount(receiveAmount);
    setReceiveAmount(sendAmount);
    amountSource.current = amountSource.current === "send" ? "receive" : "send";
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
