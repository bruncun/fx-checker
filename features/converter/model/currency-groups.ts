import type { AvailableCurrency } from "./currencies";

export type CurrencyPickerItem = AvailableCurrency;

export type CurrencyPickerGroup = {
  count: number;
  currencies: CurrencyPickerItem[];
  label: string;
};

const popularCurrencyCodes = new Set(["USD", "EUR", "GBP"]);

export function getCurrencyGroups(currencies: AvailableCurrency[]): CurrencyPickerGroup[] {
  const popularCurrencies = currencies.filter((currency) =>
    popularCurrencyCodes.has(currency.code)
  );
  const otherCurrencies = currencies.filter((currency) => !popularCurrencyCodes.has(currency.code));

  return [
    { count: popularCurrencies.length, currencies: popularCurrencies, label: "Popular" },
    { count: otherCurrencies.length, currencies: otherCurrencies, label: "Other currencies" },
  ].filter((group) => group.count > 0);
}
