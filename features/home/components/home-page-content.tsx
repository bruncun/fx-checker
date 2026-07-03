"use client";

import { CompareRatesProvider } from "@/features/compare-rates";
import {
  normalizeConversionInput,
  type Conversion,
  type CreateConversionInput,
} from "@/features/conversion-log";
import {
  createConversion,
  deleteAllConversions,
  deleteConversion,
} from "@/features/conversion-log/client";
import { Converter, type SelectedCurrency } from "@/features/converter";
import type { AvailableCurrency } from "@/features/converter/currencies";
import type { AmountSide } from "@/features/converter/exchange";
import {
  findFavorite,
  getFavoritePairKey,
  normalizeFavoritePair,
  type Favorite,
  type FavoriteCurrencyPair,
} from "@/features/favorites";
import { createFavorite, deleteFavorite } from "@/features/favorites/client";
import { Header } from "@/features/header";
import { deriveLiveRateForPair, LiveRateList, type LiveRate } from "@/features/live-rates";
import type { FrankfurterRate } from "@/lib/frankfurter";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { ReactNode } from "react";
import { startTransition, useMemo, useOptimistic, useState } from "react";

const DEFAULT_CONVERTER_AMOUNT = "1000";
const DEFAULT_CONVERTER_AMOUNT_SOURCE: AmountSide = "send";

type HomePageContentProps = {
  availableCurrencies: AvailableCurrency[];
  children: ReactNode;
  conversions?: Conversion[];
  currencyCount: number;
  favorites?: Favorite[];
  liveRateHistoryRates: FrankfurterRate[];
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
  amount,
  amountSource,
  pathname,
  receiveCurrency,
  searchParams,
  sendCurrency,
}: {
  amount?: string;
  amountSource?: AmountSide;
  pathname: string;
  receiveCurrency: SelectedCurrency;
  searchParams: URLSearchParams;
  sendCurrency: SelectedCurrency;
}) {
  const nextSearchParams = new URLSearchParams(searchParams);

  nextSearchParams.set("from", sendCurrency.currencyCode);
  nextSearchParams.set("to", receiveCurrency.currencyCode);

  if (amount !== undefined) {
    nextSearchParams.set("amount", amount);
  }

  if (amountSource !== undefined) {
    nextSearchParams.set("amountSource", amountSource);
  }

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

function getConverterAmountFromParams(searchParams: URLSearchParams) {
  const amount = searchParams.has("amount")
    ? (searchParams.get("amount") ?? "")
    : DEFAULT_CONVERTER_AMOUNT;
  const amountSource =
    searchParams.get("amountSource") === "receive" ? "receive" : DEFAULT_CONVERTER_AMOUNT_SOURCE;

  return {
    amount,
    amountSource,
  } satisfies { amount: string; amountSource: AmountSide };
}

export function HomePageContent({
  availableCurrencies,
  children,
  conversions: initialConversions = [],
  currencyCount,
  favorites: initialFavorites = [],
  liveRateHistoryRates,
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
  const converterAmount = useMemo(
    () => getConverterAmountFromParams(new URLSearchParams(searchParamsString)),
    [searchParamsString]
  );
  const [optimisticSelectedCurrencies, setOptimisticSelectedCurrencies] = useState(() => ({
    currencies: selectedCurrencyPairFromUrl,
    urlKey: selectedCurrencyPairUrlKey,
  }));
  const selectedCurrencies =
    optimisticSelectedCurrencies.urlKey === selectedCurrencyPairUrlKey
      ? optimisticSelectedCurrencies.currencies
      : selectedCurrencyPairFromUrl;
  const [favorites, setFavorites] = useState(initialFavorites);
  const [conversions, setConversions] = useState(initialConversions);
  const [optimisticFavorites, updateOptimisticFavorites] = useOptimistic(
    favorites,
    (
      currentFavorites,
      action: { favorite: Favorite; type: "add" } | { pair: FavoriteCurrencyPair; type: "remove" }
    ) => {
      if (action.type === "remove") {
        const pairKey = getFavoritePairKey(action.pair);

        return currentFavorites.filter((favorite) => getFavoritePairKey(favorite) !== pairKey);
      }

      if (findFavorite(currentFavorites, action.favorite)) {
        return currentFavorites;
      }

      return [...currentFavorites, action.favorite];
    }
  );
  const [optimisticConversions, updateOptimisticConversions] = useOptimistic(
    conversions,
    (
      currentConversions,
      action:
        | { conversion: Conversion; type: "add" }
        | { id: string; type: "remove" }
        | { type: "clear" }
    ) => {
      if (action.type === "remove") {
        return currentConversions.filter((conversion) => conversion.id !== action.id);
      }

      if (action.type === "clear") {
        return [];
      }

      return [action.conversion, ...currentConversions];
    }
  );

  function updateSelectedCurrencies({
    amount,
    amountSource,
    receiveCurrency,
    sendCurrency,
  }: {
    receiveCurrency: SelectedCurrency;
    sendCurrency: SelectedCurrency;
    amount?: string;
    amountSource?: AmountSide;
  }) {
    setOptimisticSelectedCurrencies({
      currencies: {
        receiveCurrency,
        sendCurrency,
      },
      urlKey: selectedCurrencyPairUrlKey,
    });

    const nextUrl = getCurrencyPairUrl({
      amount,
      amountSource,
      pathname,
      receiveCurrency,
      searchParams: new URLSearchParams(searchParamsString),
      sendCurrency,
    });
    const currentUrl = searchParamsString ? `${pathname}?${searchParamsString}` : pathname;

    if (nextUrl !== currentUrl) {
      router.replace(nextUrl, { scroll: false });
    }
  }

  function selectCompareCurrency(receiveCurrency: SelectedCurrency) {
    updateSelectedCurrencies({
      sendCurrency: selectedCurrencies.sendCurrency,
      receiveCurrency,
    });
  }

  function toggleFavorite(pair: FavoriteCurrencyPair) {
    const normalizedPair = normalizeFavoritePair(pair);
    const existingFavorite = findFavorite(optimisticFavorites, normalizedPair);

    if (existingFavorite) {
      startTransition(async () => {
        updateOptimisticFavorites({ pair: normalizedPair, type: "remove" });

        try {
          await deleteFavorite(normalizedPair);
          setFavorites((currentFavorites) =>
            currentFavorites.filter(
              (favorite) => getFavoritePairKey(favorite) !== getFavoritePairKey(normalizedPair)
            )
          );
        } catch (error) {
          console.error("Failed to delete favorite", error);
          setFavorites((currentFavorites) => [...currentFavorites]);
        }
      });

      return;
    }

    const pendingFavorite: Favorite = {
      ...normalizedPair,
      createdAt: new Date().toISOString(),
      id: `optimistic:${getFavoritePairKey(normalizedPair)}`,
    };

    startTransition(async () => {
      updateOptimisticFavorites({ favorite: pendingFavorite, type: "add" });

      try {
        const createdFavorite = await createFavorite(normalizedPair);

        setFavorites((currentFavorites) => {
          const withoutPendingOrExisting = currentFavorites.filter(
            (favorite) => getFavoritePairKey(favorite) !== getFavoritePairKey(createdFavorite)
          );

          return [...withoutPendingOrExisting, createdFavorite];
        });
      } catch {
        setFavorites((currentFavorites) =>
          currentFavorites.filter(
            (favorite) => getFavoritePairKey(favorite) !== getFavoritePairKey(normalizedPair)
          )
        );
      }
    });
  }

  function logConversion(input: CreateConversionInput) {
    const normalizedInput = normalizeConversionInput(input);

    if (!normalizedInput.sendAmount || !normalizedInput.receiveAmount) {
      return;
    }

    const pendingConversion: Conversion = {
      ...normalizedInput,
      createdAt: new Date().toISOString(),
      id: `optimistic:${crypto.randomUUID()}`,
    };

    startTransition(async () => {
      updateOptimisticConversions({ conversion: pendingConversion, type: "add" });

      try {
        const createdConversion = await createConversion(normalizedInput);

        setConversions((currentConversions) => [
          createdConversion,
          ...currentConversions.filter((conversion) => conversion.id !== pendingConversion.id),
        ]);
      } catch (error) {
        console.error("Failed to log conversion", error);
        setConversions((currentConversions) =>
          currentConversions.filter((conversion) => conversion.id !== pendingConversion.id)
        );
      }
    });
  }

  function removeConversion(id: string) {
    startTransition(async () => {
      updateOptimisticConversions({ id, type: "remove" });

      try {
        await deleteConversion(id);
        setConversions((currentConversions) =>
          currentConversions.filter((conversion) => conversion.id !== id)
        );
      } catch (error) {
        console.error("Failed to delete conversion", error);
        setConversions((currentConversions) => [...currentConversions]);
      }
    });
  }

  function clearConversions() {
    if (optimisticConversions.length === 0) {
      return;
    }

    startTransition(async () => {
      updateOptimisticConversions({ type: "clear" });

      try {
        await deleteAllConversions();
        setConversions([]);
      } catch (error) {
        console.error("Failed to clear conversions", error);
        setConversions((currentConversions) => [...currentConversions]);
      }
    });
  }

  function selectConversion(conversion: Conversion) {
    const sendCurrency = getCurrencyByCode(availableCurrencies, conversion.fromCurrency);
    const receiveCurrency = getCurrencyByCode(availableCurrencies, conversion.toCurrency);

    if (!sendCurrency || !receiveCurrency) {
      return;
    }

    updateSelectedCurrencies({
      sendCurrency,
      receiveCurrency,
      amount: conversion.sendAmount,
      amountSource: "send",
    });
  }

  const selectedFavoritePair = {
    fromCurrency: selectedCurrencies.sendCurrency.currencyCode,
    toCurrency: selectedCurrencies.receiveCurrency.currencyCode,
  };
  const favoriteRates = optimisticFavorites.flatMap((favorite) => {
    const rate = deriveLiveRateForPair({
      base: favorite.fromCurrency,
      historicalRates: liveRateHistoryRates,
      latestRates: rates,
      quote: favorite.toCurrency,
    });

    return rate ? [rate] : [];
  });

  return (
    <main className="text-white min-h-screen bg-neutral-900">
      <Header currencyCount={currencyCount} />
      <LiveRateList rates={liveRates} />
      <div className="mx-auto max-w-[1100px] px-200 py-400 sm:px-300 sm:py-600 lg:px-400">
        <Converter
          key={`${converterAmount.amountSource}:${converterAmount.amount}`}
          currencies={availableCurrencies}
          initialAmount={converterAmount.amount}
          initialAmountSource={converterAmount.amountSource}
          rates={rates}
          sendCurrency={selectedCurrencies.sendCurrency}
          receiveCurrency={selectedCurrencies.receiveCurrency}
          isFavorite={findFavorite(optimisticFavorites, selectedFavoritePair) !== null}
          onConversionLogCreate={logConversion}
          onFavoriteToggle={toggleFavorite}
          onSelectedCurrenciesChange={updateSelectedCurrencies}
        />
        <CompareRatesProvider
          value={{
            ...converterAmount,
            availableCurrencies,
            conversions: optimisticConversions,
            favoriteRates,
            favorites: optimisticFavorites,
            rates,
            receiveCurrency: selectedCurrencies.receiveCurrency,
            sendCurrency: selectedCurrencies.sendCurrency,
            onCurrencyPairSelect: updateSelectedCurrencies,
            onCompareCurrencySelect: selectCompareCurrency,
            onConversionCreate: logConversion,
            onConversionDelete: removeConversion,
            onConversionsClear: clearConversions,
            onConversionSelect: selectConversion,
            onFavoriteToggle: toggleFavorite,
          }}
        >
          <div className="mt-500 lg:mt-400">{children}</div>
        </CompareRatesProvider>
      </div>
    </main>
  );
}
