"use client";

import type { FlagCountryCode } from "@/components/ui/flag";
import type { CreateConversionInput } from "@/features/conversion-log";
import type { FavoriteCurrencyPair } from "@/features/favorites";
import type { FrankfurterRate } from "@/lib/frankfurter";
import type { AvailableCurrency } from "../currencies";
import { getExchangeRate, formatExchangeRate } from "../exchange";
import type { AmountSide } from "../exchange";
import { ConverterAmountControls } from "./converter-amount-controls";

export type SelectedCurrency = {
  countryCode: FlagCountryCode;
  currencyCode: string;
};

type ConverterProps = {
  currencies: AvailableCurrency[];
  initialAmount?: string;
  initialAmountSource?: AmountSide;
  receiveCurrency: SelectedCurrency;
  rates: FrankfurterRate[];
  sendCurrency: SelectedCurrency;
  isFavorite?: boolean;
  onFavoriteToggle?: (pair: FavoriteCurrencyPair) => void;
  onConversionLogCreate?: (conversion: CreateConversionInput) => void;
  onSelectedCurrenciesChange: (currencies: {
    receiveCurrency: SelectedCurrency;
    sendCurrency: SelectedCurrency;
  }) => void;
};

function Converter({
  currencies,
  initialAmount,
  initialAmountSource,
  receiveCurrency,
  rates,
  sendCurrency,
  isFavorite = false,
  onConversionLogCreate,
  onFavoriteToggle,
  onSelectedCurrenciesChange,
}: ConverterProps) {
  const exchangeRate = getExchangeRate(
    rates,
    sendCurrency.currencyCode,
    receiveCurrency.currencyCode
  );
  const exchangeRateLabel =
    exchangeRate === null
      ? `Rate unavailable for ${sendCurrency.currencyCode}/${receiveCurrency.currencyCode}`
      : `1 ${sendCurrency.currencyCode} = ${formatExchangeRate(exchangeRate)} ${receiveCurrency.currencyCode}`;

  return (
    <section aria-labelledby="converter-heading">
      <h1 id="converter-heading" className="mb-200 text-preset-2 text-neutral-50 uppercase">
        Check the Rate
      </h1>
      <div className="rounded-20 bg-neutral-700 shadow-[0_12px_40px_0_rgb(0_0_0_/_0.4)]">
        <ConverterAmountControls
          currencies={currencies}
          exchangeRateLabel={exchangeRateLabel}
          initialAmount={initialAmount}
          initialAmountSource={initialAmountSource}
          isFavorite={isFavorite}
          rates={rates}
          receiveCurrency={receiveCurrency}
          sendCurrency={sendCurrency}
          onConversionLogCreate={onConversionLogCreate}
          onFavoriteToggle={onFavoriteToggle}
          onSelectedCurrenciesChange={onSelectedCurrenciesChange}
        />
      </div>
    </section>
  );
}

export { Converter };
