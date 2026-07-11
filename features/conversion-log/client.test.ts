// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from "vitest";

import {
  GUEST_CONVERSIONS_COOKIE,
  GUEST_MODE_COOKIE,
  readGuestConversionsCookie,
} from "@/features/guest-session/guest-session";
import { createConversion, deleteAllConversions, deleteConversion } from "./client";

function getCookieValue(name: string) {
  return document.cookie
    .split("; ")
    .find((cookie) => cookie.startsWith(`${name}=`))
    ?.slice(name.length + 1);
}

function clearCookie(name: string) {
  document.cookie = `${name}=; Path=/; Max-Age=0`;
}

afterEach(() => {
  clearCookie(GUEST_CONVERSIONS_COOKIE);
  clearCookie(GUEST_MODE_COOKIE);
  vi.unstubAllGlobals();
});

describe("conversion log client", () => {
  it("uses session-cookie persistence without fetch in guest mode", async () => {
    const fetch = vi.fn();

    vi.stubGlobal("fetch", fetch);
    document.cookie = `${GUEST_MODE_COOKIE}=1; Path=/; SameSite=Lax`;

    const conversion = await createConversion({
      fromCurrency: " usd ",
      receiveAmount: " 86.50 ",
      sendAmount: " 100 ",
      toCurrency: "eur",
    });

    expect(fetch).not.toHaveBeenCalled();
    expect(conversion).toMatchObject({
      fromCurrency: "USD",
      receiveAmount: "86.50",
      sendAmount: "100",
      toCurrency: "EUR",
    });
    expect(readGuestConversionsCookie(getCookieValue(GUEST_CONVERSIONS_COOKIE))).toEqual([
      conversion,
    ]);

    await deleteConversion(conversion.id);

    expect(fetch).not.toHaveBeenCalled();
    expect(readGuestConversionsCookie(getCookieValue(GUEST_CONVERSIONS_COOKIE))).toEqual([]);

    await createConversion({
      fromCurrency: "GBP",
      receiveAmount: "125",
      sendAmount: "100",
      toCurrency: "USD",
    });
    await deleteAllConversions();

    expect(fetch).not.toHaveBeenCalled();
    expect(readGuestConversionsCookie(getCookieValue(GUEST_CONVERSIONS_COOKIE))).toEqual([]);
  });
});
