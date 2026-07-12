"use client";

import * as React from "react";

import type { FlagCountryCode } from "@/components/ui/flag";
import type { Conversion, CreateConversionInput } from "@/features/conversion-log";
import type { Favorite } from "@/features/favorites";
import { useDataUnavailableError } from "@/features/home/hooks/use-data-unavailable-error";
import {
  getConverterAmountFromParams,
  getCurrencyPairUrl,
  getSelectedCurrencyPairFromParams,
  getSelectedCurrencyPairKey,
} from "@/features/home/utils/url-state";
import type { FrankfurterRate } from "@/lib/frankfurter";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { AvailableCurrency } from "../model/currencies";
import { getExchangeRate, formatExchangeRate } from "../model/exchange";
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
    React.startTransition(async () => {
      const [
        { normalizeConversionInput },
        { createConversion },
        { addOptimisticConversion, removeOptimisticConversion, replaceOptimisticConversion },
      ] = await Promise.all([
        import("@/features/conversion-log/model/conversion-log"),
        import("@/features/conversion-log/api/client"),
        import("@/features/conversion-log/stores/optimistic-conversions"),
      ]);
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
    <>
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
    </>
  );
}

export { Converter };
