"use client";

import * as React from "react";

import { FavoriteButton } from "@/components/ui/favorite-button";
import { Icon } from "@/components/ui/icon";
import { RateChange } from "@/components/ui/rate-change";
import {
  RateDetailsList,
  RateDetailsTreeGrid,
  RateDetailsTreeGridCell,
  RateDetailsTreeGridRow,
} from "@/components/ui/rate-details-list";
import { TabEmptyState } from "@/components/ui/tab-empty-state";
import { TabPendingState } from "@/components/ui/tab-pending-state";
import { useTransitioningList } from "@/hooks/use-transitioning-list";
import type { SelectedCurrency } from "@/features/converter/model/selected-currency";
import type { AvailableCurrency } from "@/features/converter/model/currencies";
import {
  getFavoritePairKey,
  type Favorite,
  type FavoriteCurrencyPair,
} from "@/features/favorites/model/favorites";
import { deleteFavorite } from "@/features/favorites/api/client-actions";
import {
  addOptimisticFavorite,
  removeOptimisticFavorite,
  useOptimisticFavorites,
} from "@/features/favorites/stores/optimistic-favorites";
import { useConverterPairSelection } from "@/features/home/hooks/use-converter-pair-selection";
import { useDataUnavailableError } from "@/features/home/hooks/use-data-unavailable-error";
import type { LiveRate } from "@/features/live-rates/components/live-rate-item";
import type { FrankfurterRate } from "@/lib/frankfurter";
import { cn } from "@/lib/utils";
import {
  getAvailableCurrencyByCode,
  getFavoriteRateRow,
  getLiveRateByPair,
  toSelectedCurrency,
  type FavoriteRateItemData,
} from "../model/favorite-rate-rows";

function getFavoriteRateMotionKey(item: FavoriteRateItemData) {
  return getFavoritePairKey(item.favorite);
}

type FavoriteRateItemProps = FavoriteRateItemData & {
  isEntering?: boolean;
  isExiting?: boolean;
  onFavoriteToggle: (pair: FavoriteCurrencyPair) => void;
  onPairSelect: (currencies: {
    receiveCurrency: SelectedCurrency;
    sendCurrency: SelectedCurrency;
  }) => void;
  tabIndex: 0 | -1;
};

function FavoriteRateItem({
  favorite,
  fromCurrency,
  isEntering = false,
  isExiting = false,
  onFavoriteToggle,
  onPairSelect,
  rate,
  tabIndex,
  toCurrency,
}: FavoriteRateItemProps) {
  const pair = {
    fromCurrency: favorite.fromCurrency,
    toCurrency: favorite.toCurrency,
  };
  const directionLabel = rate.direction;
  const rowLabel = `Use ${rate.pair} in converter, rate ${rate.rate}, ${directionLabel} ${rate.change}`;

  function selectPair() {
    onPairSelect({
      receiveCurrency: toSelectedCurrency(toCurrency),
      sendCurrency: toSelectedCurrency(fromCurrency),
    });
  }

  return (
    <RateDetailsTreeGridRow
      aria-label={rowLabel}
      action={(actionProps) => (
        <FavoriteButton
          {...actionProps}
          aria-label="Remove"
          onClick={(event) => {
            event.stopPropagation();
            onFavoriteToggle(pair);
          }}
          pinned
          variant="icon"
          data-favorite-rate-button
        />
      )}
      className={cn(isEntering && "fx-list-row-in", isExiting && "fx-list-row-out")}
      gridClassName="grid-cols-[minmax(0,1fr)_auto_auto]"
      onSelect={selectPair}
      rowId={rate.pair}
      tabIndex={tabIndex}
    >
      <RateDetailsTreeGridCell className="block min-w-0" isPrimary tabIndex={tabIndex}>
        <span className="inline-flex min-w-0 items-center gap-100 text-preset-4 text-neutral-50 uppercase">
          <span>{fromCurrency.code}</span>
          <Icon decorative iconName="arrow-right" />
          <span>{toCurrency.code}</span>
        </span>
      </RateDetailsTreeGridCell>
      <RateDetailsTreeGridCell className="block min-w-[9ch] text-right leading-0">
        <span className="block text-preset-3 text-neutral-50">{rate.rate}</span>
        <RateChange
          className="mt-075 justify-end text-preset-6"
          indicatorClassName="text-preset-6"
          direction={rate.direction}
          value={rate.change}
        />
      </RateDetailsTreeGridCell>
    </RateDetailsTreeGridRow>
  );
}

type FavoriteRatesProps = {
  availableCurrencies: AvailableCurrency[];
  favorites: Favorite[];
  initialFavoriteRates?: FavoriteRateItemData[];
  latestRates: FrankfurterRate[];
  liveRates: LiveRate[];
  liveRateHistoryRates: FrankfurterRate[];
};

function FavoriteRates({
  availableCurrencies,
  favorites: initialFavorites,
  initialFavoriteRates,
  latestRates,
  liveRates,
  liveRateHistoryRates,
}: FavoriteRatesProps) {
  const selectConverterPair = useConverterPairSelection();
  const showDataUnavailableError = useDataUnavailableError();
  const favorites = useOptimisticFavorites(initialFavorites);
  const [preferredTabStopPair, setPreferredTabStopPair] = React.useState(
    favorites[0] ? `${favorites[0].fromCurrency}/${favorites[0].toCurrency}` : ""
  );
  const currencyByCode = getAvailableCurrencyByCode(availableCurrencies);
  const liveRateByPair = getLiveRateByPair(liveRates);
  const initialFavoriteRateByKey = new Map(
    (initialFavoriteRates ?? []).map((item) => [getFavoritePairKey(item.favorite), item])
  );
  const favoriteRates = favorites.flatMap((favorite) => {
    const initialFavoriteRate = initialFavoriteRateByKey.get(getFavoritePairKey(favorite));

    if (initialFavoriteRate) {
      return [{ ...initialFavoriteRate, favorite }];
    }

    const row = getFavoriteRateRow({
      currencyByCode,
      favorite,
      latestRates,
      liveRateByPair,
      liveRateHistoryRates,
    });

    return row ? [row] : [];
  });
  const favoriteTransitions = useTransitioningList({
    getKey: getFavoriteRateMotionKey,
    items: favoriteRates,
  });
  const tabStopPair = favoriteRates.some((item) => item.rate.pair === preferredTabStopPair)
    ? preferredTabStopPair
    : (favoriteRates[0]?.rate.pair ?? "");

  function selectCurrencyPair(currencies: {
    receiveCurrency: SelectedCurrency;
    sendCurrency: SelectedCurrency;
  }) {
    selectConverterPair({
      receiveCurrency: currencies.receiveCurrency,
      sendCurrency: currencies.sendCurrency,
    });
  }

  function toggleFavorite(pair: FavoriteCurrencyPair) {
    const pairKey = getFavoritePairKey(pair);
    const existingFavorite = favorites.find((favorite) => getFavoritePairKey(favorite) === pairKey);

    if (!existingFavorite || favoriteTransitions.exitingKeys.has(pairKey)) {
      return;
    }

    favoriteTransitions.startExit(pairKey, () => {
      removeOptimisticFavorite(pair);
    });

    React.startTransition(async () => {
      try {
        await deleteFavorite(pair);
      } catch (error) {
        const removalPending = favoriteTransitions.hasPendingExit(pairKey);

        console.error("Failed to delete favorite", error);
        favoriteTransitions.cancelExit(pairKey);

        if (!removalPending) {
          addOptimisticFavorite(existingFavorite);
        }

        showDataUnavailableError();
      }
    });
  }

  if (favoriteRates.length === 0) {
    return (
      <TabEmptyState
        className={favoriteTransitions.isEmptyEntering ? "fx-state-in" : undefined}
        title="No pinned pairs yet"
        lead={
          <>
            Pin a pair to track its rate here. Tap the star
            <br className="hidden sm:inline" /> icon on any conversion or comparison row.
          </>
        }
      />
    );
  }

  return (
    <RateDetailsList
      aria-label="Favorites"
      className={favoriteTransitions.isListEntering ? "fx-state-in" : undefined}
      countSlot={
        <p className="text-preset-5 text-neutral-50 opacity-70">{favorites.length} Favorites</p>
      }
      headingId="favorites-heading"
      headingSlot={<span className="block text-preset-3-medium text-neutral-50">Pinned Pairs</span>}
    >
      <RateDetailsTreeGrid
        actionSelector="[data-favorite-rate-button]"
        labelledBy="favorites-heading"
        onCurrentRowIdChange={setPreferredTabStopPair}
        columns={
          <>
            <th role="columnheader" scope="col">
              Pair
            </th>
            <th role="columnheader" scope="col">
              Rate change
            </th>
            <th role="columnheader" scope="col">
              Favorite
            </th>
          </>
        }
      >
        {favoriteRates.map((item) => (
          <FavoriteRateItem
            key={getFavoritePairKey(item.favorite)}
            {...item}
            isEntering={favoriteTransitions.enteringKeys.has(getFavoritePairKey(item.favorite))}
            isExiting={favoriteTransitions.exitingKeys.has(getFavoritePairKey(item.favorite))}
            onFavoriteToggle={toggleFavorite}
            onPairSelect={selectCurrencyPair}
            tabIndex={item.rate.pair === tabStopPair ? 0 : -1}
          />
        ))}
      </RateDetailsTreeGrid>
    </RateDetailsList>
  );
}

function FavoriteRatesFallback() {
  return <TabPendingState label="Loading favorites" />;
}

export { FavoriteRates, FavoriteRatesFallback };
