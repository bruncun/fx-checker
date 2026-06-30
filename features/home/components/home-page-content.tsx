"use client";

import { Converter, type SelectedCurrency } from "@/features/converter";
import type { AvailableCurrency } from "@/features/converter/currencies";
import { Header } from "@/features/header";
import { LiveRateList, type LiveRate } from "@/features/live-rates";
import type { FrankfurterRate } from "@/lib/frankfurter";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";

type HomePageContentProps = {
  availableCurrencies: AvailableCurrency[];
  children: ReactNode;
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

function getSelectedCurrencyPairFromParams(
  currencies: AvailableCurrency[],
  searchParams: URLSearchParams
) {
  const defaultCurrencyPair = getDefaultCurrencyPair(currencies);
  const sendCurrency = getCurrencyByCode(currencies, searchParams.get("from")?.toUpperCase() ?? "");
  const receiveCurrency = getCurrencyByCode(
    currencies,
    searchParams.get("to")?.toUpperCase() ?? ""
  );

  return {
    sendCurrency: sendCurrency ?? defaultCurrencyPair.sendCurrency,
    receiveCurrency: receiveCurrency ?? defaultCurrencyPair.receiveCurrency,
  };
}

function getCurrencyPairUrl({
  pathname,
  receiveCurrency,
  searchParams,
  sendCurrency,
}: {
  pathname: string;
  receiveCurrency: SelectedCurrency;
  searchParams: URLSearchParams;
  sendCurrency: SelectedCurrency;
}) {
  const nextSearchParams = new URLSearchParams(searchParams);

  nextSearchParams.set("from", sendCurrency.currencyCode);
  nextSearchParams.set("to", receiveCurrency.currencyCode);

  const queryString = nextSearchParams.toString();

  return queryString ? `${pathname}?${queryString}` : pathname;
}

function getSelectedCurrencyPairKey({
  receiveCurrency,
  sendCurrency,
}: {
  receiveCurrency: SelectedCurrency;
  sendCurrency: SelectedCurrency;
}) {
  return `${sendCurrency.currencyCode}/${receiveCurrency.currencyCode}`;
}

export function HomePageContent({
  availableCurrencies,
  children,
  currencyCount,
  liveRates,
  rates,
}: HomePageContentProps) {
  const pathname = usePathname() ?? "/";
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchParamsString = searchParams.toString();
  const selectedCurrencyPairFromUrl = useMemo(
    () =>
      getSelectedCurrencyPairFromParams(
        availableCurrencies,
        new URLSearchParams(searchParamsString)
      ),
    [availableCurrencies, searchParamsString]
  );
  const selectedCurrencyPairUrlKey = getSelectedCurrencyPairKey(selectedCurrencyPairFromUrl);
  const [optimisticSelectedCurrencies, setOptimisticSelectedCurrencies] = useState(() => ({
    currencies: selectedCurrencyPairFromUrl,
    urlKey: selectedCurrencyPairUrlKey,
  }));
  const selectedCurrencies =
    optimisticSelectedCurrencies.urlKey === selectedCurrencyPairUrlKey
      ? optimisticSelectedCurrencies.currencies
      : selectedCurrencyPairFromUrl;

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

    updateSelectedCurrencies({ sendCurrency, receiveCurrency });
  }

  return (
    <main className="text-white min-h-screen bg-neutral-900">
      <Header currencyCount={currencyCount} />
      <LiveRateList rates={liveRates} onRateSelect={selectLiveRate} />
      <div className="mx-auto max-w-[1100px] px-200 py-400 sm:px-300 sm:py-600 lg:px-400">
        <Converter
          currencies={availableCurrencies}
          rates={rates}
          sendCurrency={selectedCurrencies.sendCurrency}
          receiveCurrency={selectedCurrencies.receiveCurrency}
          onSelectedCurrenciesChange={updateSelectedCurrencies}
        />
        <div className="mt-500 lg:mt-400">{children}</div>
      </div>
    </main>
  );
}
