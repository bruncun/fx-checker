"use client";

import { createContext, useContext, type ReactNode } from "react";

import type { SelectedCurrency } from "@/features/converter";
import type { AvailableCurrency } from "@/features/converter/currencies";
import type { AmountSide } from "@/features/converter/exchange";
import type { FrankfurterRate } from "@/lib/frankfurter";

export type CompareRatesPresentationValue = {
  amount: string;
  amountSource: AmountSide;
  availableCurrencies: AvailableCurrency[];
  rates: FrankfurterRate[];
  receiveCurrency: SelectedCurrency;
  sendCurrency: SelectedCurrency;
};

const CompareRatesPresentationContext = createContext<CompareRatesPresentationValue | null>(null);

type CompareRatesProviderProps = {
  children: ReactNode;
  value: CompareRatesPresentationValue;
};

export function CompareRatesProvider({ children, value }: CompareRatesProviderProps) {
  return (
    <CompareRatesPresentationContext.Provider value={value}>
      {children}
    </CompareRatesPresentationContext.Provider>
  );
}

export function useCompareRatesPresentation() {
  const value = useContext(CompareRatesPresentationContext);

  if (!value) {
    throw new Error("useCompareRatesPresentation must be used within CompareRatesProvider");
  }

  return value;
}
