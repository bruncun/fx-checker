"use client";

import { Converter, type SelectedCurrency } from "@/features/converter";
import type { AvailableCurrency } from "@/features/converter/currencies";
import { Header } from "@/features/header";
import { LiveRateList, type LiveRate } from "@/features/live-rates";
import type { FrankfurterRate } from "@/lib/frankfurter";
import { useMemo, useState } from "react";

type HomePageContentProps = {
  availableCurrencies: AvailableCurrency[];
  currencyCount: number;
  liveRates: LiveRate[];
  rates: FrankfurterRate[];
};

function getCurrencyByCode(currencies: AvailableCurrency[], code: string): SelectedCurrency | null {
  const currency = currencies.find((availableCurrency) => availableCurrency.code === code);

  if (!currency) {
    return null;
  }

  return {
    countryCode: currency.countryCode,
    currencyCode: currency.code,
  };
}

function getDefaultCurrencyPair(currencies: AvailableCurrency[]) {
  const defaultSendCurrency =
    currencies.find((currency) => currency.code === "USD") ?? currencies[0];
  const defaultReceiveCurrency =
    currencies.find(
      (currency) => currency.code === "EUR" && currency.code !== defaultSendCurrency.code
    ) ??
    currencies.find((currency) => currency.code !== defaultSendCurrency.code) ??
    defaultSendCurrency;

  return {
    sendCurrency: {
      countryCode: defaultSendCurrency.countryCode,
      currencyCode: defaultSendCurrency.code,
    },
    receiveCurrency: {
      countryCode: defaultReceiveCurrency.countryCode,
      currencyCode: defaultReceiveCurrency.code,
    },
  };
}

export function HomePageContent({
  availableCurrencies,
  currencyCount,
  liveRates,
  rates,
}: HomePageContentProps) {
  const defaultCurrencyPair = useMemo(
    () => getDefaultCurrencyPair(availableCurrencies),
    [availableCurrencies]
  );
  const [selectedCurrencies, setSelectedCurrencies] = useState(defaultCurrencyPair);

  function selectLiveRate(rate: LiveRate) {
    const [sendCurrencyCode, receiveCurrencyCode] = rate.pair.split("/");

    if (!sendCurrencyCode || !receiveCurrencyCode) {
      return;
    }

    const sendCurrency = getCurrencyByCode(availableCurrencies, sendCurrencyCode);
    const receiveCurrency = getCurrencyByCode(availableCurrencies, receiveCurrencyCode);

    if (!sendCurrency || !receiveCurrency) {
      return;
    }

    setSelectedCurrencies({ sendCurrency, receiveCurrency });
  }

  return (
    <main className="text-white min-h-screen bg-neutral-900">
      <Header currencyCount={currencyCount} />
      <LiveRateList rates={liveRates} onRateSelect={selectLiveRate} />
      <div className="mx-auto max-w-[1100px] px-200 py-400 sm:px-300 sm:py-600">
        <Converter
          currencies={availableCurrencies}
          rates={rates}
          sendCurrency={selectedCurrencies.sendCurrency}
          receiveCurrency={selectedCurrencies.receiveCurrency}
          onSelectedCurrenciesChange={setSelectedCurrencies}
        />
      </div>
    </main>
  );
}
