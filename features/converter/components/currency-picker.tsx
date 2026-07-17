"use client";

import * as React from "react";

import type { FlagCountryCode } from "@/components/ui/flag";
import type { AvailableCurrency } from "../model/currencies";
import { getCurrencyGroups, type CurrencyPickerItem } from "../model/currency-groups";
import { CurrencyPickerContent } from "./currency-picker-content";
import { CurrencyPickerShell, type CurrencyPickerShellHandle } from "./currency-picker-shell";

export interface CurrencyPickerProps {
  className?: string;
  countryCode: FlagCountryCode;
  currencies: AvailableCurrency[];
  currencyCode: string;
  flagFetchPriority?: React.ComponentProps<typeof CurrencyPickerShell>["flagFetchPriority"];
  flagLoading?: React.ComponentProps<typeof CurrencyPickerShell>["flagLoading"];
  focusSearchRequest?: number;
  focusTriggerRequest?: number;
  openRequest?: number;
  ref?: React.Ref<CurrencyPickerHandle>;
  onPickerOpen?: () => void;
  onCurrencySelect?: (currency: CurrencyPickerItem) => void;
  left?: boolean;
}

export type CurrencyPickerHandle = CurrencyPickerShellHandle;

function CurrencyPicker({ currencies, ...props }: CurrencyPickerProps) {
  return (
    <CurrencyPickerShell
      {...props}
      renderContent={(contentProps) => (
        <CurrencyPickerContent
          {...contentProps}
          ref={contentProps.contentRef}
          currencies={currencies}
        />
      )}
    />
  );
}

export { CurrencyPicker, getCurrencyGroups };
