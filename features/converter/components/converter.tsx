"use client";

import * as React from "react";

import type {
  Conversion,
  CreateConversionInput,
} from "@/features/conversion-log/model/conversion-log";
import { useDataUnavailableError } from "@/features/home/hooks/use-data-unavailable-error";
import { getCurrencyPairUrl, getSelectedCurrencyPairKey } from "@/features/home/utils/url-state";
import type { FrankfurterRate } from "@/lib/frankfurter";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { AvailableCurrency } from "../model/currencies";
import { getConverterModel, getExchangeRateLabel } from "../model/converter";
import type { AmountSide } from "../model/exchange";
import type { SelectedCurrency } from "../model/selected-currency";
import { ConverterAmountControls } from "./converter-amount-controls";

type ConverterProps = {
  currencyReferencePromise: Promise<AvailableCurrency[]>;
  favoriteButtonSlot: React.ReactNode;
  initialConverterModel?: ReturnType<typeof getConverterModel>;
  rates: FrankfurterRate[];
};

function getOptimisticId() {
  return `optimistic:${globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2)}`;
}

async function loadConversionLogDependencies() {
  const [
    { normalizeConversionInput },
    { createConversion },
    { addOptimisticConversion, removeOptimisticConversion, replaceOptimisticConversion },
  ] = await Promise.all([
    import("@/features/conversion-log/model/conversion-log"),
    import("@/features/conversion-log/api/client"),
    import("@/features/conversion-log/stores/optimistic-conversions"),
  ]);

  return {
    addOptimisticConversion,
    createConversion,
    normalizeConversionInput,
    removeOptimisticConversion,
    replaceOptimisticConversion,
  };
}

function Converter({
  currencyReferencePromise,
  favoriteButtonSlot,
  initialConverterModel,
  rates,
}: ConverterProps) {
  const pathname = usePathname() ?? "/";
  const router = useRouter();
  const [, startTransition] = React.useTransition();
  const showDataUnavailableError = useDataUnavailableError();
  const searchParams = useSearchParams();
  const searchParamsString = searchParams.toString();
  const canUseInitialModel = initialConverterModel !== undefined && searchParamsString === "";
  const liveConverterModel = canUseInitialModel
    ? initialConverterModel
    : getConverterModel({
        rates,
        searchParams: new URLSearchParams(searchParamsString),
      });
  const selectedCurrencyPairFromUrl = {
    receiveCurrency: liveConverterModel.receiveCurrency,
    sendCurrency: liveConverterModel.sendCurrency,
  };
  const selectedCurrencyPairUrlKey = getSelectedCurrencyPairKey(selectedCurrencyPairFromUrl);
  const converterAmount = liveConverterModel.converterAmount;
  const [localSelectedCurrencies, setLocalSelectedCurrencies] = React.useState<{
    currencies: {
      receiveCurrency: SelectedCurrency;
      sendCurrency: SelectedCurrency;
    };
    serverUrlKey: string;
  }>(() => ({
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
  const exchangeRateLabel =
    sendCurrency.currencyCode === liveConverterModel.sendCurrency.currencyCode &&
    receiveCurrency.currencyCode === liveConverterModel.receiveCurrency.currencyCode
      ? liveConverterModel.exchangeRateLabel
      : getExchangeRateLabel({ rates, receiveCurrency, sendCurrency });

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
      const {
        addOptimisticConversion,
        createConversion,
        normalizeConversionInput,
        removeOptimisticConversion,
        replaceOptimisticConversion,
      } = await loadConversionLogDependencies();
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
          currencyReferencePromise={currencyReferencePromise}
          exchangeRateLabel={exchangeRateLabel}
          favoriteButtonSlot={favoriteButtonSlot}
          focusTriggerRequests={focusTriggerRequests}
          initialAmount={converterAmount.amount}
          initialAmountSource={converterAmount.amountSource}
          initialReceiveAmount={converterAmount.receiveAmount}
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
export type { SelectedCurrency };
