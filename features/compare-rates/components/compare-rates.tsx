"use client";

import * as React from "react";

import { Flag } from "@/components/ui/flag";
import { FavoriteButton } from "@/components/ui/favorite-button";
import {
  RateDetailsList,
  type RateDetailsRowActionProps,
  RateDetailsTreeGrid,
  RateDetailsTreeGridRow,
} from "@/components/ui/rate-details-list";
import { TabEmptyState } from "@/components/ui/tab-empty-state";
import { interactiveSurfaceClassName } from "@/components/ui/interactive-surface";
import type { AvailableCurrency } from "@/features/converter/model/currencies";
import type { AmountSide } from "@/features/converter/model/exchange";
import type { SelectedCurrency } from "@/features/converter";
import {
  findFavorite,
  getFavoritePairKey,
  normalizeFavoritePair,
  type Favorite,
  type FavoriteCurrencyPair,
} from "@/features/favorites";
import { createFavorite, deleteFavorite } from "@/features/favorites/api/client";
import {
  addOptimisticFavorite,
  removeOptimisticFavorite,
  replaceOptimisticFavorite,
  useOptimisticFavorites,
} from "@/features/favorites/stores/optimistic-favorites";
import { useDataUnavailableError } from "@/features/home/hooks/use-data-unavailable-error";
import { scrollConverterIntoViewIfNeeded } from "@/features/home/utils/scroll-converter-into-view";
import { getConverterAmountFromParams, getCurrencyPairUrl } from "@/features/home/utils/url-state";
import type { FrankfurterRate } from "@/lib/frankfurter";
import { cn } from "@/lib/utils";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  formatMoneyValue,
  getCompareCurrencies,
  getCompareRatesModel,
  type CompareRateItemData,
} from "../model/compare-rates";

const COMPARE_FALLBACK_CURRENCIES = [
  { code: "GBP", countryCode: "gb", name: "British Pound" },
  { code: "JPY", countryCode: "jp", name: "Japanese Yen" },
  { code: "CHF", countryCode: "ch", name: "Swiss Franc" },
  { code: "CAD", countryCode: "ca", name: "Canadian Dollar" },
  { code: "AUD", countryCode: "au", name: "Australian Dollar" },
  { code: "INR", countryCode: "in", name: "Indian Rupee" },
  { code: "CNY", countryCode: "cn", name: "Chinese Renminbi Yuan" },
  { code: "BRL", countryCode: "br", name: "Brazilian Real" },
] as const;
const COMPARE_FALLBACK_AMOUNT_WIDTHS = [76, 92, 84, 70, 86, 96, 78, 88];

function SkeletonBlock({ className, style }: { className: string; style?: React.CSSProperties }) {
  return <span aria-hidden className={cn("fx-skeleton block", className)} style={style} />;
}

function SkeletonIconButton() {
  return (
    <span
      aria-hidden="true"
      className={cn(interactiveSurfaceClassName, "pointer-events-none p-100")}
    >
      <span className="fx-skeleton fx-skeleton-control block size-200 rounded-4" />
    </span>
  );
}

type CompareRateItemProps = {
  amount: string;
  currency: AvailableCurrency;
  favoritesPromise?: Promise<Favorite[]>;
  fromCurrencyCode: string;
  isSelected: boolean;
  onCompareCurrencySelect?: (currency: AvailableCurrency) => void;
  rate: string;
  tabIndex: 0 | -1;
};

type CompareFavoriteButtonProps = {
  actionProps: RateDetailsRowActionProps;
  favoritesPromise: Promise<Favorite[]>;
  pair: FavoriteCurrencyPair;
};

function CompareFavoriteButtonFallback({
  actionProps,
}: Pick<CompareFavoriteButtonProps, "actionProps">) {
  return (
    <button
      {...actionProps}
      aria-label="Loading favorite state"
      className={cn(interactiveSurfaceClassName, "p-100")}
      data-compare-favorite-button
      disabled
      type="button"
    >
      <span aria-hidden="true" className="fx-skeleton fx-skeleton-control size-200 rounded-4" />
    </button>
  );
}

function CompareFavoriteButton({
  actionProps,
  favoritesPromise,
  pair,
}: CompareFavoriteButtonProps) {
  const router = useRouter();
  const showDataUnavailableError = useDataUnavailableError();
  const initialFavorites = React.use(favoritesPromise);
  const favorites = useOptimisticFavorites(initialFavorites);
  const normalizedPair = normalizeFavoritePair(pair);
  const existingFavorite = findFavorite(favorites, normalizedPair);
  const isFavorite = existingFavorite !== null;

  function toggleFavorite(event: React.MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();

    if (existingFavorite) {
      removeOptimisticFavorite(normalizedPair);

      React.startTransition(async () => {
        try {
          await deleteFavorite(normalizedPair);
          router.refresh();
        } catch (error) {
          console.error("Failed to delete favorite", error);
          addOptimisticFavorite(existingFavorite);
          showDataUnavailableError();
        }
      });

      return;
    }

    const pendingFavorite: Favorite = {
      ...normalizedPair,
      createdAt: new Date().toISOString(),
      id: `optimistic:${getFavoritePairKey(normalizedPair)}`,
    };

    addOptimisticFavorite(pendingFavorite);

    React.startTransition(async () => {
      try {
        const createdFavorite = await createFavorite(normalizedPair);

        replaceOptimisticFavorite(pendingFavorite, createdFavorite);
        router.refresh();
      } catch (error) {
        console.error("Failed to create favorite", error);
        removeOptimisticFavorite(normalizedPair);
        showDataUnavailableError();
      }
    });
  }

  return (
    <FavoriteButton
      {...actionProps}
      aria-label={isFavorite ? "Remove" : "Favorite"}
      onClick={toggleFavorite}
      pinned={isFavorite}
      variant="icon"
      data-compare-favorite-button
    />
  );
}

function CompareRateItem({
  amount,
  currency,
  favoritesPromise,
  fromCurrencyCode,
  isSelected,
  onCompareCurrencySelect,
  rate,
  tabIndex,
}: CompareRateItemProps) {
  const pair = {
    fromCurrency: fromCurrencyCode,
    toCurrency: currency.code,
  };
  const rowLabel = `Use ${fromCurrencyCode}/${currency.code} in converter, ${amount} ${currency.code} at ${rate}`;

  function selectCompareCurrency() {
    onCompareCurrencySelect?.(currency);
  }

  return (
    <RateDetailsTreeGridRow
      aria-label={rowLabel}
      action={(actionProps) =>
        favoritesPromise ? (
          <React.Suspense fallback={<CompareFavoriteButtonFallback actionProps={actionProps} />}>
            <CompareFavoriteButton
              key={getFavoritePairKey(pair)}
              actionProps={actionProps}
              favoritesPromise={favoritesPromise}
              pair={pair}
            />
          </React.Suspense>
        ) : (
          <CompareFavoriteButtonFallback actionProps={actionProps} />
        )
      }
      gridClassName="grid-cols-[auto_minmax(0,1fr)_auto_auto]"
      isSelected={isSelected}
      onSelect={selectCompareCurrency}
      rowId={currency.code}
      tabIndex={tabIndex}
    >
      <td aria-hidden="true" className="block" role="presentation">
        <Flag alt="" className="size-300" countryCode={currency.countryCode} />
      </td>
      <td className="block max-w-[16ch] min-w-0 sm:max-w-none" role="cell">
        <span className="block text-preset-4 text-neutral-50">{currency.code}</span>
        <span className="mt-075 block truncate text-preset-5 text-neutral-200">
          {currency.name}
        </span>
      </td>
      <td className="block max-w-[16ch] min-w-0 text-right sm:max-w-none" role="cell">
        <span className="block truncate text-preset-3 text-neutral-50">{amount}</span>
        <span className="mt-075 block text-preset-6 text-neutral-200">@ {rate}</span>
      </td>
    </RateDetailsTreeGridRow>
  );
}

type CompareRatesProps = {
  amount: string;
  amountSource: AmountSide;
  availableCurrencies: AvailableCurrency[];
  favoritesPromise: Promise<Favorite[]>;
  initialCompareRates?: CompareRateItemData[];
  initialSendAmount?: string;
  rates: FrankfurterRate[];
  receiveCurrency: SelectedCurrency;
  sendCurrency: SelectedCurrency;
};

type CompareRatesPanelProps = Omit<
  CompareRatesProps,
  "favoritesPromise" | "initialCompareRates" | "initialSendAmount"
> & {
  compareRates: CompareRateItemData[];
  favoritesPromise?: Promise<Favorite[]>;
  onCompareCurrencySelect?: (currency: AvailableCurrency) => void;
  onCurrentRowIdChange?: (rowId: string) => void;
  sendAmount: string;
  tabStopCode: string;
};

function CompareRatesPanel({
  compareRates,
  favoritesPromise,
  onCompareCurrencySelect,
  onCurrentRowIdChange,
  receiveCurrency,
  sendAmount,
  sendCurrency,
  tabStopCode,
}: CompareRatesPanelProps) {
  if (["0", ""].includes(sendAmount.trim())) {
    return (
      <TabEmptyState
        title="No comparison available"
        lead={
          <>
            Enter an amount in SEND above to see what your
            <br className="hidden sm:inline" /> money is worth in other currencies.
          </>
        }
      />
    );
  }

  return (
    <RateDetailsList
      countClassName="mt-125 sm:mt-0"
      countSlot={
        <p className="text-preset-5 text-neutral-50 opacity-70">{compareRates.length} Pairs</p>
      }
      headerClassName="block sm:flex sm:items-center sm:justify-between"
      headingId="compare-heading"
      headingClassName="flex min-w-0 flex-wrap gap-x-125 text-preset-4 text-neutral-200 items-end"
      headingSlot={
        <>
          <span>Multi-Currency</span>
          <span className="inline-flex min-w-0 gap-125 text-preset-3-medium text-neutral-50">
            <span className="max-w-[12ch] truncate sm:max-w-none">
              {formatMoneyValue(sendAmount)}
            </span>
            <span className="shrink-0">From {sendCurrency.currencyCode}</span>
          </span>
        </>
      }
    >
      <RateDetailsTreeGrid
        actionSelector="[data-compare-favorite-button]"
        aria-label="Rates table"
        onCurrentRowIdChange={onCurrentRowIdChange ?? (() => {})}
        columns={
          <>
            <th aria-hidden="true" scope="col">
              Flag
            </th>
            <th role="columnheader" scope="col">
              Currency
            </th>
            <th role="columnheader" scope="col">
              Conversion
            </th>
            <th role="columnheader" scope="col">
              Favorite
            </th>
          </>
        }
      >
        {compareRates.map((item) => (
          <CompareRateItem
            key={item.currency.code}
            amount={item.amount}
            currency={item.currency}
            favoritesPromise={favoritesPromise}
            fromCurrencyCode={sendCurrency.currencyCode}
            isSelected={item.currency.code === receiveCurrency.currencyCode}
            onCompareCurrencySelect={onCompareCurrencySelect}
            rate={item.rate}
            tabIndex={item.currency.code === tabStopCode ? 0 : -1}
          />
        ))}
      </RateDetailsTreeGrid>
    </RateDetailsList>
  );
}

function CompareRates({
  amount,
  amountSource,
  availableCurrencies,
  favoritesPromise,
  initialCompareRates,
  initialSendAmount,
  rates,
  receiveCurrency,
  sendCurrency,
}: CompareRatesProps) {
  const pathname = usePathname() ?? "/";
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchParamsString = searchParams.toString();
  const [preferredTabStopCode, setPreferredTabStopCode] = React.useState(
    receiveCurrency.currencyCode
  );
  const liveConverterAmount = React.useMemo(() => {
    const liveSearchParams = new URLSearchParams(searchParamsString);

    if (!liveSearchParams.has("amount") && !liveSearchParams.has("amountSource")) {
      return { amount, amountSource };
    }

    return getConverterAmountFromParams(liveSearchParams);
  }, [amount, amountSource, searchParamsString]);
  const canUseInitialModel =
    liveConverterAmount.amount === amount &&
    liveConverterAmount.amountSource === amountSource &&
    initialCompareRates !== undefined &&
    initialSendAmount !== undefined;
  const { compareRates, sendAmount } = canUseInitialModel
    ? { compareRates: initialCompareRates, sendAmount: initialSendAmount }
    : getCompareRatesModel({
        amount: liveConverterAmount.amount,
        amountSource: liveConverterAmount.amountSource,
        availableCurrencies,
        rates,
        receiveCurrency,
        sendCurrency,
      });
  const tabStopCode = compareRates.some((item) => item.currency.code === preferredTabStopCode)
    ? preferredTabStopCode
    : (compareRates[0]?.currency.code ?? "");

  function selectCompareCurrency(currency: AvailableCurrency) {
    const nextUrl = getCurrencyPairUrl({
      pathname,
      receiveCurrency: {
        countryCode: currency.countryCode,
        currencyCode: currency.code,
      },
      searchParams: new URLSearchParams(searchParamsString),
      sendCurrency,
    });

    router.replace(nextUrl, { scroll: false });
    setPreferredTabStopCode(currency.code);
    scrollConverterIntoViewIfNeeded();
  }

  return (
    <CompareRatesPanel
      amount={liveConverterAmount.amount}
      amountSource={liveConverterAmount.amountSource}
      availableCurrencies={availableCurrencies}
      compareRates={compareRates}
      favoritesPromise={favoritesPromise}
      onCompareCurrencySelect={selectCompareCurrency}
      onCurrentRowIdChange={setPreferredTabStopCode}
      rates={rates}
      receiveCurrency={receiveCurrency}
      sendAmount={sendAmount}
      sendCurrency={sendCurrency}
      tabStopCode={tabStopCode}
    />
  );
}

function CompareRatesFallback() {
  return (
    <RateDetailsList
      className="min-h-[369px]"
      countClassName="mt-125 sm:mt-0"
      countSlot={<p className="text-preset-5 text-neutral-50 opacity-70">8 Pairs</p>}
      headerClassName="block sm:flex sm:items-center sm:justify-between"
      headingId="compare-heading"
      headingClassName="flex min-w-0 flex-wrap gap-x-125 text-preset-4 text-neutral-200 items-end"
      headingSlot={
        <>
          <span>Multi-Currency</span>
          <span className="inline-flex min-w-0 gap-125 text-preset-3-medium text-neutral-50">
            <SkeletonBlock className="h-[19px] w-[53px] rounded-4" />
            <span className="inline-flex shrink-0 items-center gap-125">
              <span>From</span>
              <SkeletonBlock className="h-[19px] w-[32px] rounded-4" />
            </span>
          </span>
        </>
      }
    >
      <div aria-hidden="true" className="flex flex-col gap-150">
        {COMPARE_FALLBACK_CURRENCIES.map((currency, index) => (
          <div
            className="grid grid-cols-[auto_minmax(0,1fr)_auto_auto] items-center gap-x-125 rounded-16 bg-neutral-600 px-150 py-150 shadow-[inset_0_0_0_1px_hsl(var(--neutral-500))] sm:gap-x-250 sm:px-200"
            key={currency.code}
          >
            <Flag className="size-300" countryCode={currency.countryCode} />
            <div className="max-w-[16ch] min-w-0 sm:max-w-none">
              <span className="block text-preset-4 text-neutral-50">{currency.code}</span>
              <span className="mt-075 block truncate text-preset-5 text-neutral-200">
                {currency.name}
              </span>
            </div>
            <div className="min-w-0 justify-self-end">
              <SkeletonBlock
                className="h-[19px] rounded-4"
                style={{ width: COMPARE_FALLBACK_AMOUNT_WIDTHS[index] }}
              />
              <SkeletonBlock className="mt-075 ml-auto h-[10px] w-[52px] rounded-4" />
            </div>
            <SkeletonIconButton />
          </div>
        ))}
      </div>
    </RateDetailsList>
  );
}

export { CompareRates, CompareRatesFallback, getCompareCurrencies };
