import { getCurrencyFlagCountryCode } from "@/features/converter/model/currencies";
import { normalizeConverterRates } from "@/features/converter/model/exchange";
import type { FrankfurterRate } from "@/lib/frankfurter";

/**
 * Build the first converter model from the latest-rate snapshot only.
 *
 * The complete currency reference remains for the picker. The static flag map
 * keeps unsupported rate codes out of URL-selected converter pairs.
 */
export function getInitialConverterRates(rates: FrankfurterRate[]) {
  return normalizeConverterRates(
    rates,
    rates
      .filter(({ quote }) => getCurrencyFlagCountryCode(quote) !== undefined)
      .map(({ quote }) => quote)
  );
}
