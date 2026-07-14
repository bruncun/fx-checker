"use client";

import * as React from "react";

import type { FlagCountryCode } from "@/components/ui/flag";
import type { Conversion, CreateConversionInput } from "@/features/conversion-log";
import type { Favorite } from "@/features/favorites";
import { useDataUnavailableError } from "@/features/home/hooks/use-data-unavailable-error";
import {
  getConverterAmountFromParams,
  getCurrencyCodePairFromParams,
  getCurrencyPairUrl,
  getSelectedCurrencyPairKey,
} from "@/features/home/utils/url-state";
import type { FrankfurterRate } from "@/lib/frankfurter";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { AvailableCurrency } from "../model/currencies";
import { getExchangeRate, formatExchangeRate, type AmountSide } from "../model/exchange";
import { ConverterAmountControls } from "./converter-amount-controls";

export type SelectedCurrency = {
  countryCode?: FlagCountryCode;
  currencyCode: string;
};

type ConverterProps = {
  currencyReferencePromise: Promise<AvailableCurrency[]>;
  favoritesPromise: Promise<Favorite[]>;
  rates: FrankfurterRate[];
};

function getOptimisticId() {
  return `optimistic:${globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2)}`;
}

const defaultSelectedCurrencies = {
  receiveCurrency: { currencyCode: "EUR" },
  sendCurrency: { currencyCode: "USD" },
} satisfies { receiveCurrency: SelectedCurrency; sendCurrency: SelectedCurrency };

function getSelectableCurrencyCodes(rates: FrankfurterRate[]) {
  const sharedBase = rates[0]?.base;

  if (!sharedBase || rates.some((rate) => rate.base !== sharedBase)) {
    return new Set<string>();
  }

  return new Set([sharedBase, ...rates.map((rate) => rate.quote)]);
}

function getSelectedCurrencyPairFromCodes(rates: FrankfurterRate[], searchParams: URLSearchParams) {
  const selectableCurrencyCodes = getSelectableCurrencyCodes(rates);
  const { receiveCurrencyCode, sendCurrencyCode } = getCurrencyCodePairFromParams(searchParams);
  const fallbackSendCurrencyCode = selectableCurrencyCodes.has("USD")
    ? "USD"
    : (selectableCurrencyCodes.values().next().value ??
      defaultSelectedCurrencies.sendCurrency.currencyCode);
  const fallbackReceiveCurrencyCode = selectableCurrencyCodes.has("EUR")
    ? "EUR"
    : ([...selectableCurrencyCodes].find((code) => code !== fallbackSendCurrencyCode) ??
      fallbackSendCurrencyCode);

  return {
    receiveCurrency: {
      currencyCode: selectableCurrencyCodes.has(receiveCurrencyCode)
        ? receiveCurrencyCode
        : fallbackReceiveCurrencyCode,
    },
    sendCurrency: {
      currencyCode: selectableCurrencyCodes.has(sendCurrencyCode)
        ? sendCurrencyCode
        : fallbackSendCurrencyCode,
    },
  };
}

function Converter({ currencyReferencePromise, favoritesPromise, rates }: ConverterProps) {
  const pathname = usePathname() ?? "/";
  const router = useRouter();
  const [, startTransition] = React.useTransition();
  const showDataUnavailableError = useDataUnavailableError();
  const searchParams = useSearchParams();
  const searchParamsString = searchParams.toString();
  const selectedCurrencyPairFromUrl = getSelectedCurrencyPairFromCodes(
    rates,
    new URLSearchParams(searchParamsString)
  );
  const selectedCurrencyPairUrlKey = getSelectedCurrencyPairKey(selectedCurrencyPairFromUrl);
  const converterAmount = getConverterAmountFromParams(new URLSearchParams(searchParamsString));
  const [localSelectedCurrencies, setLocalSelectedCurrencies] = React.useState(() => ({
    currencies: selectedCurrencyPairFromUrl,
    serverUrlKey: selectedCurrencyPairUrlKey,
  }));
  const [focusTriggerRequests, setFocusTriggerRequests] = React.useState<
    Record<AmountSide, number>
  >({
    receive: 0,
    send: 0,
  });
  const selectedCurrencies =
    localSelectedCurrencies.serverUrlKey === selectedCurrencyPairUrlKey
      ? localSelectedCurrencies.currencies
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

  function updateSelectedCurrencies(
    currencies: {
      receiveCurrency: SelectedCurrency;
      sendCurrency: SelectedCurrency;
    },
    selectedSide?: AmountSide
  ) {
    if (selectedSide) {
      setFocusTriggerRequests((requests) => ({
        ...requests,
        [selectedSide]: requests[selectedSide] + 1,
      }));
    }

    setLocalSelectedCurrencies({
      currencies,
      serverUrlKey: selectedCurrencyPairUrlKey,
    });

    const nextUrl = getCurrencyPairUrl({
      pathname,
      receiveCurrency: currencies.receiveCurrency,
      searchParams: new URLSearchParams(searchParamsString),
      sendCurrency: currencies.sendCurrency,
    });
    const currentUrl = searchParamsString ? `${pathname}?${searchParamsString}` : pathname;

    if (nextUrl !== currentUrl) {
      window.history.replaceState(null, "", nextUrl);
      startTransition(() => {
        router.refresh();
      });
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
          key={selectedCurrencyPairUrlKey}
          currencyReferencePromise={currencyReferencePromise}
          exchangeRateLabel={exchangeRateLabel}
          focusTriggerRequests={focusTriggerRequests}
          initialAmount={converterAmount.amount}
          initialAmountSource={converterAmount.amountSource}
          initialReceiveAmount={converterAmount.receiveAmount}
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
