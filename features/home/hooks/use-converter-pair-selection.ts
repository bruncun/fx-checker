"use client";

import type { SelectedCurrency } from "@/features/converter/model/selected-currency";
import type { AmountSide } from "@/features/converter/model/exchange";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import * as React from "react";
import { scrollConverterIntoViewIfNeeded } from "../utils/scroll-converter-into-view";
import { getCurrencyPairUrl } from "../utils/url-state";

type SelectConverterPairInput = {
  amount?: string;
  amountSource?: AmountSide;
  receiveAmount?: string;
  receiveCurrency: SelectedCurrency;
  sendCurrency: SelectedCurrency;
};

function useConverterPairSelection() {
  const pathname = usePathname() ?? "/";
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchParamsString = searchParams.toString();

  return React.useCallback(
    ({
      amount,
      amountSource,
      receiveAmount,
      receiveCurrency,
      sendCurrency,
    }: SelectConverterPairInput) => {
      const nextUrl = getCurrencyPairUrl({
        amount,
        amountSource,
        pathname,
        receiveAmount,
        receiveCurrency,
        searchParams: new URLSearchParams(searchParamsString),
        sendCurrency,
      });

      router.replace(nextUrl, { scroll: false });
      scrollConverterIntoViewIfNeeded();
    },
    [pathname, router, searchParamsString]
  );
}

const useSelectConverterPair = useConverterPairSelection;

export { useConverterPairSelection, useSelectConverterPair };
export type { SelectConverterPairInput };
