import type { FlagCountryCode } from "@/components/ui/flag";
import type { FrankfurterCurrency, FrankfurterRate } from "@/lib/frankfurter";

export type AvailableCurrency = {
  code: string;
  countryCode: FlagCountryCode;
  name: string;
};

const currencyFlagCountryCodes: Partial<Record<string, FlagCountryCode>> = {
  AED: "ae",
  ARS: "ar",
  AUD: "au",
  BDT: "bd",
  BGN: "bg",
  BHD: "bh",
  BRL: "br",
  CAD: "ca",
  CHF: "ch",
  CLP: "cl",
  CNY: "cn",
  COP: "co",
  CYP: "cy",
  CZK: "cz",
  DKK: "dk",
  EGP: "eg",
  EUR: "eu",
  GBP: "gb",
  HKD: "hk",
  HNL: "hn",
  HRK: "hr",
  HTG: "ht",
  HUF: "hu",
  IDR: "id",
  INR: "in",
  ISK: "is",
  JOD: "jo",
  JPY: "jp",
  KES: "ke",
  KRW: "kr",
  KWD: "kw",
  LBP: "lb",
  LKR: "lk",
  MAD: "ma",
  MXN: "mx",
  MYR: "my",
  NGN: "ng",
  NOK: "no",
  NPR: "np",
  NZD: "nz",
  OMR: "om",
  PEN: "pe",
  PHP: "ph",
  PKR: "pk",
  PLN: "pl",
  QAR: "qa",
  RON: "ro",
  RUB: "ru",
  SAR: "sa",
  SEK: "se",
  SGD: "sg",
  THB: "th",
  TRY: "tr",
  TWD: "tw",
  UAH: "ua",
  USD: "us",
  VND: "vn",
  XCD: "lc",
  ZAR: "za",
};

export function deriveAvailableCurrencies(
  currencies: FrankfurterCurrency[],
  rates: FrankfurterRate[]
): AvailableCurrency[] {
  const sharedBase = rates[0]?.base;

  if (!sharedBase || rates.some((rate) => rate.base !== sharedBase)) {
    return [];
  }

  const rateCurrencies = new Set([sharedBase, ...rates.map((rate) => rate.quote)]);

  return currencies.flatMap((currency) => {
    const countryCode = currencyFlagCountryCodes[currency.iso_code];

    return countryCode && rateCurrencies.has(currency.iso_code)
      ? [{ code: currency.iso_code, countryCode, name: currency.name }]
      : [];
  });
}
