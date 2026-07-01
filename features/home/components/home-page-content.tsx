"use client";

import { CompareRatesProvider } from "@/features/compare-rates";
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
import { LiveRateList, type LiveRate } from "@/features/live-rates";
import type { FrankfurterRate } from "@/lib/frankfurter";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { ReactNode } from "react";
import { startTransition, useMemo, useOptimistic, useState } from "react";

type HomePageContentProps = {
  availableCurrencies: AvailableCurrency[];
  children: ReactNode;
  currencyCount: number;
  favorites?: Favorite[];
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
  favorites: initialFavorites = [],
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
  const [converterAmount, setConverterAmount] = useState<{
    amount: string;
    amountSource: AmountSide;
  }>({
    amount: "1000",
    amountSource: "send",
  });
  const [favorites, setFavorites] = useState(initialFavorites);
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

  const selectedFavoritePair = {
    fromCurrency: selectedCurrencies.sendCurrency.currencyCode,
    toCurrency: selectedCurrencies.receiveCurrency.currencyCode,
  };

  return (
    <main className="text-white min-h-screen bg-neutral-900">
      <Header currencyCount={currencyCount} />
      <LiveRateList rates={liveRates} onRateSelect={selectLiveRate} />
      <div className="mx-auto max-w-[1100px] px-200 py-400 sm:px-300 sm:py-600 lg:px-400">
        <Converter
          amount={converterAmount.amount}
          amountSource={converterAmount.amountSource}
          currencies={availableCurrencies}
          rates={rates}
          sendCurrency={selectedCurrencies.sendCurrency}
          receiveCurrency={selectedCurrencies.receiveCurrency}
          isFavorite={findFavorite(optimisticFavorites, selectedFavoritePair) !== null}
          onAmountChange={setConverterAmount}
          onFavoriteToggle={toggleFavorite}
          onSelectedCurrenciesChange={updateSelectedCurrencies}
        />
        <CompareRatesProvider
          value={{
            ...converterAmount,
            availableCurrencies,
            favorites: optimisticFavorites,
            rates,
            receiveCurrency: selectedCurrencies.receiveCurrency,
            sendCurrency: selectedCurrencies.sendCurrency,
            onCompareCurrencySelect: selectCompareCurrency,
            onFavoriteToggle: toggleFavorite,
          }}
        >
          <div className="mt-500 lg:mt-400">{children}</div>
        </CompareRatesProvider>
      </div>
    </main>
  );
}
