"use client";

import { usePathname, useSearchParams } from "next/navigation";
import * as React from "react";

import type { AmountSide } from "../model/exchange";

type ConverterAmountState = {
  amount: string;
  amountSource: AmountSide;
  receiveAmount?: string;
};

function areConverterAmountStatesEqual(left: ConverterAmountState, right: ConverterAmountState) {
  return (
    left.amount === right.amount &&
    left.amountSource === right.amountSource &&
    left.receiveAmount === right.receiveAmount
  );
}

function usePersistedConverterAmount({
  initialAmount,
  initialAmountSource,
  initialReceiveAmount,
}: {
  initialAmount?: string;
  initialAmountSource?: AmountSide;
  initialReceiveAmount?: string;
}) {
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const searchParamsString = searchParams.toString();
  const routeAmountState = React.useMemo<ConverterAmountState>(
    () => ({
      amount: initialAmount ?? "",
      amountSource: initialAmountSource ?? "send",
      receiveAmount: initialAmountSource === "send" ? initialReceiveAmount : undefined,
    }),
    [initialAmount, initialAmountSource, initialReceiveAmount]
  );
  const [amountState, setAmountState] = React.useState<ConverterAmountState>({
    ...routeAmountState,
  });
  const hasMountedRef = React.useRef(false);
  const skipNextPersistenceRef = React.useRef(false);

  React.useEffect(() => {
    setAmountState((currentAmountState) => {
      if (areConverterAmountStatesEqual(currentAmountState, routeAmountState)) {
        return currentAmountState;
      }

      skipNextPersistenceRef.current = true;
      return routeAmountState;
    });
  }, [routeAmountState]);

  React.useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }

    if (skipNextPersistenceRef.current) {
      skipNextPersistenceRef.current = false;
      return;
    }

    const nextSearchParams = new URLSearchParams(searchParamsString);
    const currentAmount = nextSearchParams.has("amount")
      ? (nextSearchParams.get("amount") ?? "")
      : null;
    const currentAmountSource = nextSearchParams.get("amountSource") ?? "send";
    const currentReceiveAmount = nextSearchParams.get("receiveAmount") ?? undefined;

    if (
      currentAmount === amountState.amount &&
      currentAmountSource === amountState.amountSource &&
      currentReceiveAmount === amountState.receiveAmount
    ) {
      return;
    }

    if (window.location.pathname !== pathname) {
      return;
    }

    nextSearchParams.set("amount", amountState.amount);
    nextSearchParams.set("amountSource", amountState.amountSource);

    if (amountState.receiveAmount === undefined) {
      nextSearchParams.delete("receiveAmount");
    } else {
      nextSearchParams.set("receiveAmount", amountState.receiveAmount);
    }

    const queryString = nextSearchParams.toString();
    const nextUrl = queryString ? `${pathname}?${queryString}` : pathname;
    const currentUrl = searchParamsString ? `${pathname}?${searchParamsString}` : pathname;

    if (nextUrl !== currentUrl) {
      const timeoutId = window.setTimeout(() => {
        if (window.location.pathname === pathname) {
          window.history.replaceState(null, "", nextUrl);
        }
      }, 0);

      return () => window.clearTimeout(timeoutId);
    }
  }, [amountState, pathname, searchParamsString]);

  return [amountState, setAmountState] as const;
}

export { usePersistedConverterAmount };
export type { ConverterAmountState };
