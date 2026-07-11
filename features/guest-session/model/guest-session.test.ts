import { describe, expect, it } from "vitest";

import {
  addGuestFavorite,
  readGuestConversionsCookie,
  readGuestFavoritesCookie,
  removeGuestFavorite,
  serializeGuestConversionsCookie,
  serializeGuestFavoritesCookie,
} from "../model/guest-session";

describe("guest session storage", () => {
  it("serializes and reads favorites from the session cookie payload", () => {
    const favorite = addGuestFavorite([], { fromCurrency: " usd ", toCurrency: "eur" });
    const cookieValue = serializeGuestFavoritesCookie([favorite]);

    expect(readGuestFavoritesCookie(cookieValue)).toEqual([
      expect.objectContaining({
        fromCurrency: "USD",
        id: favorite.id,
        toCurrency: "EUR",
      }),
    ]);
  });

  it("removes favorites by normalized currency pair", () => {
    const favorite = addGuestFavorite([], { fromCurrency: "USD", toCurrency: "EUR" });

    expect(removeGuestFavorite([favorite], { fromCurrency: "usd", toCurrency: "eur" })).toEqual([]);
  });

  it("serializes and reads conversions from the session cookie payload", () => {
    const cookieValue = serializeGuestConversionsCookie([
      {
        createdAt: "2026-07-07T00:00:00.000Z",
        fromCurrency: "USD",
        id: "guest-conversion:1",
        receiveAmount: "91.20",
        sendAmount: "100",
        toCurrency: "EUR",
      },
    ]);

    expect(readGuestConversionsCookie(cookieValue)).toEqual([
      {
        createdAt: "2026-07-07T00:00:00.000Z",
        fromCurrency: "USD",
        id: "guest-conversion:1",
        receiveAmount: "91.20",
        sendAmount: "100",
        toCurrency: "EUR",
      },
    ]);
  });
});
