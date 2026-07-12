import { describe, expect, it } from "vitest";

import {
  addGuestFavorite,
  getGuestStarterConversions,
  getGuestStarterFavorites,
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

  it("provides a small starter set of guest favorites", () => {
    expect(getGuestStarterFavorites()).toEqual([
      expect.objectContaining({ fromCurrency: "USD", toCurrency: "EUR" }),
      expect.objectContaining({ fromCurrency: "GBP", toCurrency: "USD" }),
      expect.objectContaining({ fromCurrency: "EUR", toCurrency: "JPY" }),
    ]);
  });

  it("provides a small starter set of recent guest conversions", () => {
    const now = new Date("2026-07-12T12:00:00.000Z");

    expect(getGuestStarterConversions(now)).toEqual([
      expect.objectContaining({
        createdAt: "2026-07-12T11:52:00.000Z",
        fromCurrency: "USD",
        toCurrency: "EUR",
      }),
      expect.objectContaining({
        createdAt: "2026-07-12T10:00:00.000Z",
        fromCurrency: "GBP",
        toCurrency: "USD",
      }),
      expect.objectContaining({
        createdAt: "2026-07-11T10:00:00.000Z",
        fromCurrency: "EUR",
        toCurrency: "JPY",
      }),
    ]);
  });
});
