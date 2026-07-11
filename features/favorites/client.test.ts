// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from "vitest";

import {
  GUEST_FAVORITES_COOKIE,
  GUEST_MODE_COOKIE,
  readGuestFavoritesCookie,
} from "@/features/guest-session/guest-session";
import { createFavorite, deleteFavorite } from "./client";

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
  clearCookie(GUEST_FAVORITES_COOKIE);
  clearCookie(GUEST_MODE_COOKIE);
  vi.unstubAllGlobals();
});

describe("favorites client", () => {
  it("uses session-cookie persistence without fetch in guest mode", async () => {
    const fetch = vi.fn();

    vi.stubGlobal("fetch", fetch);
    document.cookie = `${GUEST_MODE_COOKIE}=1; Path=/; SameSite=Lax`;

    const favorite = await createFavorite({ fromCurrency: " usd ", toCurrency: "eur" });

    expect(fetch).not.toHaveBeenCalled();
    expect(favorite).toMatchObject({ fromCurrency: "USD", toCurrency: "EUR" });
    expect(readGuestFavoritesCookie(getCookieValue(GUEST_FAVORITES_COOKIE))).toEqual([favorite]);

    await deleteFavorite({ fromCurrency: "USD", toCurrency: "EUR" });

    expect(fetch).not.toHaveBeenCalled();
    expect(readGuestFavoritesCookie(getCookieValue(GUEST_FAVORITES_COOKIE))).toEqual([]);
  });
});
