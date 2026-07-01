import Decimal from "decimal.js-light";

import type { FrankfurterRate } from "@/lib/frankfurter";

export type AmountSide = "send" | "receive";

export const MoneyDecimal = Decimal.clone({ precision: 40 });

export function getExchangeRate(rates: FrankfurterRate[], base: string, quote: string) {
  if (base === quote) {
    return new MoneyDecimal(1);
  }

  const sharedBase = rates[0]?.base;
  if (!sharedBase || rates.some((rate) => rate.base !== sharedBase)) {
    return null;
  }

  const rateByQuote = new Map(rates.map((rate) => [rate.quote, new MoneyDecimal(rate.rate)]));
  const baseRate = base === sharedBase ? new MoneyDecimal(1) : rateByQuote.get(base);
  const quoteRate = quote === sharedBase ? new MoneyDecimal(1) : rateByQuote.get(quote);

  if (baseRate === undefined || quoteRate === undefined) {
    return null;
  }

  return quoteRate.div(baseRate);
}

export function formatExchangeRate(rate: Decimal) {
  if (rate.lt(0.0001)) {
    return rate.toSignificantDigits(4).toFixed();
  }

  return rate.toDecimalPlaces(4).toFixed(4);
}

function getConvertedAmountDecimalPlaces(amount: Decimal) {
  const absoluteAmount = amount.abs();

  if (absoluteAmount.isZero() || absoluteAmount.gte(0.01)) {
    return 2;
  }

  const magnitude = absoluteAmount.exponent();

  return Math.min(8, 3 - magnitude);
}

export function convertAmount(amount: string, rate: Decimal | null) {
  if (amount === "" || rate === null) {
    return "";
  }

  let numericAmount: Decimal;

  try {
    numericAmount = new MoneyDecimal(amount);
  } catch {
    return "";
  }

  const convertedAmount = numericAmount.mul(rate);
  const decimalPlaces = getConvertedAmountDecimalPlaces(convertedAmount);

  return convertedAmount.toDecimalPlaces(decimalPlaces).toFixed();
}
