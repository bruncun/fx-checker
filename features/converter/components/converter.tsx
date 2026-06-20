"use client";

import * as React from "react";

import { AmountInput } from "@/components/ui/amount-input";
import { ExchangeButton } from "@/components/ui/exchange-button";
import { FavoriteButton } from "@/components/ui/favorite-button";
import type { FlagCountryCode } from "@/components/ui/flag";
import { LogConversionButton } from "@/components/ui/log-conversion-button";
import { CurrencyPicker } from "./currency-picker";

const mockConversion = {
  send: {
    amount: "0",
    countryCode: "us",
    currencyCode: "USD",
  },
  receive: {
    amount: "0",
    countryCode: "eu",
    currencyCode: "EUR",
  },
  rate: "1 USD = 0.8530 EUR",
} as const;

type ConverterAmountPanelProps = {
  amount: string;
  countryCode: FlagCountryCode;
  currencyCode: string;
  label: string;
};

function ConverterAmountPanel({
  amount,
  countryCode,
  currencyCode,
  label,
}: ConverterAmountPanelProps) {
  const [selectedCurrency, setSelectedCurrency] = React.useState({
    countryCode,
    currencyCode,
  });

  return (
    <section className="flex flex-col justify-between rounded-16 bg-neutral-600 p-200 shadow-[inset_0_0_0_1px_hsl(var(--neutral-500))] sm:min-w-0 sm:flex-1 sm:p-250">
      <h2 className="mb-250 text-preset-4 text-neutral-100 uppercase">{label}</h2>
      <div className="flex items-end justify-between gap-200">
        <AmountInput
          aria-label={`${label} amount`}
          value={amount}
        />
        <CurrencyPicker
          aria-label={`Select ${label.toLowerCase()} currency`}
          countryCode={selectedCurrency.countryCode}
          currencyCode={selectedCurrency.currencyCode}
          onCurrencySelect={(currency) => {
            setSelectedCurrency({
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

function Converter() {
  return (
    <section aria-labelledby="converter-heading">
      <h1 id="converter-heading" className="mb-200 text-preset-2 text-neutral-50 uppercase">
        Check the Rate
      </h1>
      <div className="rounded-20 bg-neutral-700 shadow-[0_12px_40px_0_rgb(0_0_0_/_0.4)]">
        <div className="flex flex-col gap-200 p-200 sm:flex-row sm:items-center sm:gap-300 sm:p-250">
          <ConverterAmountPanel
            {...mockConversion.send}
            label="Send"
          />
          <ExchangeButton className="self-center" />
          <ConverterAmountPanel
            {...mockConversion.receive}
            label="Receive"
          />
        </div>
        <svg width="100%" height="1">
          <line
            x1="0"
            y1="0"
            x2="100%"
            y2="0"
            stroke="#2E2E2E"
            strokeWidth="1"
            strokeDasharray="4 4"
          />
        </svg>
        <div className="p-200 sm:flex sm:items-center sm:justify-between sm:px-250">
          <p className="text-center text-preset-6 text-neutral-50 sm:text-left sm:text-preset-5">
            {mockConversion.rate}
          </p>
          <div className="mt-200 flex flex-wrap justify-center gap-100 sm:mt-0 sm:justify-end">
            <FavoriteButton pinned />
            <LogConversionButton />
          </div>
        </div>
      </div>
    </section>
  );
}

export { Converter };
