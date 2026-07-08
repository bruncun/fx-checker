"use client";

import * as React from "react";

import type { FlagCountryCode } from "@/components/ui/flag";
import {
  normalizeConversionInput,
  type Conversion,
  type CreateConversionInput,
} from "@/features/conversion-log";
import { createConversion } from "@/features/conversion-log/client";
import {
  addOptimisticConversion,
  removeOptimisticConversion,
  replaceOptimisticConversion,
} from "@/features/conversion-log/optimistic-conversions";
import type { Favorite } from "@/features/favorites";
import { useDataUnavailableError } from "@/features/home/components/use-data-unavailable-error";
import {
  getConverterAmountFromParams,
  getCurrencyPairUrl,
  getSelectedCurrencyPairFromParams,
  getSelectedCurrencyPairKey,
} from "@/features/home/url-state";
import type { FrankfurterRate } from "@/lib/frankfurter";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { AvailableCurrency } from "../currencies";
import { getExchangeRate, formatExchangeRate } from "../exchange";
import { ConverterAmountControls } from "./converter-amount-controls";

export type SelectedCurrency = {
  countryCode: FlagCountryCode;
  currencyCode: string;
};

type ConverterProps = {
  currencies: AvailableCurrency[];
  favoritesPromise: Promise<Favorite[]>;
  rates: FrankfurterRate[];
};

function getOptimisticId() {
  return `optimistic:${globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2)}`;
}

function Converter({ currencies, favoritesPromise, rates }: ConverterProps) {
  const pathname = usePathname() ?? "/";
  const router = useRouter();
  const showDataUnavailableError = useDataUnavailableError();
  const searchParams = useSearchParams();
  const searchParamsString = searchParams.toString();
  const selectedCurrencyPairFromUrl = getSelectedCurrencyPairFromParams(
    currencies,
    new URLSearchParams(searchParamsString)
  );
  const selectedCurrencyPairUrlKey = getSelectedCurrencyPairKey(selectedCurrencyPairFromUrl);
  const converterAmount = getConverterAmountFromParams(new URLSearchParams(searchParamsString));
  const [optimisticSelectedCurrencies, setOptimisticSelectedCurrencies] = React.useState(() => ({
    currencies: selectedCurrencyPairFromUrl,
    urlKey: selectedCurrencyPairUrlKey,
  }));
  const selectedCurrencies =
    optimisticSelectedCurrencies.urlKey === selectedCurrencyPairUrlKey
      ? optimisticSelectedCurrencies.currencies
      : selectedCurrencyPairFromUrl;
  const { receiveCurrency, sendCurrency } = selectedCurrencies;
  const exchangeRate = getExchangeRate(
    rates,
    sendCurrency.currencyCode,
    receiveCurrency.currencyCode
  );
  const exchangeRateLabel =
    exchangeRate === null
      ? `Rate unavailable for ${sendCurrency.currencyCode}/${receiveCurrency.currencyCode}`
      : `1 ${sendCurrency.currencyCode} = ${formatExchangeRate(exchangeRate)} ${receiveCurrency.currencyCode}`;

  function updateSelectedCurrencies(currencies: {
    receiveCurrency: SelectedCurrency;
    sendCurrency: SelectedCurrency;
  }) {
    setOptimisticSelectedCurrencies({
      currencies,
      urlKey: selectedCurrencyPairUrlKey,
    });

    const nextUrl = getCurrencyPairUrl({
      pathname,
      receiveCurrency: currencies.receiveCurrency,
      searchParams: new URLSearchParams(searchParamsString),
      sendCurrency: currencies.sendCurrency,
    });
    const currentUrl = searchParamsString ? `${pathname}?${searchParamsString}` : pathname;

    if (nextUrl !== currentUrl) {
      router.replace(nextUrl, { scroll: false });
    }
  }

  function logConversion(input: CreateConversionInput) {
    const normalizedInput = normalizeConversionInput(input);

    if (!normalizedInput.sendAmount || !normalizedInput.receiveAmount) {
      return;
    }

    const pendingConversion: Conversion = {
      ...normalizedInput,
      createdAt: new Date().toISOString(),
      id: getOptimisticId(),
    };

    addOptimisticConversion(pendingConversion);

    React.startTransition(async () => {
      try {
        const createdConversion = await createConversion(normalizedInput);

        replaceOptimisticConversion(pendingConversion.id, createdConversion);
        router.refresh();
      } catch (error) {
        console.error("Failed to log conversion", error);
        removeOptimisticConversion(pendingConversion.id);
        showDataUnavailableError();
      }
    });
  }

  return (
    <section
      aria-labelledby="converter-heading"
      className="relative z-[30] scroll-mt-200 focus:outline-none"
      id="converter"
      tabIndex={-1}
    >
      <h1 id="converter-heading" className="mb-200 text-preset-2 text-neutral-50 uppercase">
        Check the Rate
      </h1>
      <div className="rounded-20 bg-neutral-700 shadow-[var(--shadow-elevation-card)]">
        <ConverterAmountControls
          currencies={currencies}
          exchangeRateLabel={exchangeRateLabel}
          initialAmount={converterAmount.amount}
          initialAmountSource={converterAmount.amountSource}
          favoritesPromise={favoritesPromise}
          rates={rates}
          receiveCurrency={receiveCurrency}
          sendCurrency={sendCurrency}
          onConversionLogCreate={logConversion}
          onSelectedCurrenciesChange={updateSelectedCurrencies}
        />
      </div>
    </section>
  );
}

export { Converter };
