"use client";

import { Converter } from "@/features/converter";
import type { AvailableCurrency } from "@/features/converter/currencies";
import { Header } from "@/features/header";
import type { FrankfurterRate } from "@/lib/frankfurter";
import { useMemo, useState } from "react";

type HomePageContentProps = {
  availableCurrencies: AvailableCurrency[];
  currencyCount: number;
  rates: FrankfurterRate[];
};

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
  rates,
}: HomePageContentProps) {
  const defaultCurrencyPair = useMemo(
    () => getDefaultCurrencyPair(availableCurrencies),
    [availableCurrencies]
  );
  const [selectedCurrencies, setSelectedCurrencies] = useState(defaultCurrencyPair);

  return (
    <main className="text-white min-h-screen bg-neutral-900">
      <Header currencyCount={currencyCount} />
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
