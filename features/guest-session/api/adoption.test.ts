import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  GUEST_ALERT_DISMISSED_COOKIE,
  GUEST_CONVERSIONS_COOKIE,
  GUEST_FAVORITES_COOKIE,
  GUEST_MODE_COOKIE,
  serializeGuestConversionsCookie,
  serializeGuestFavoritesCookie,
} from "../model/guest-session";

const cookieSet = vi.hoisted(() => vi.fn());
let cookieValues = vi.hoisted(() => new Map<string, string>());

vi.mock("server-only", () => ({}));

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => {
      const value = cookieValues.get(name);

      return value === undefined ? undefined : { value };
    },
    set: cookieSet,
  }),
}));

function createSupabaseMock({
  insertError = null,
  upsertError = null,
}: {
  insertError?: Error | null;
  upsertError?: Error | null;
} = {}) {
  const insert = vi.fn(() => ({ error: insertError }));
  const upsert = vi.fn(() => ({ error: upsertError }));
  const from = vi.fn((table: string) => {
    if (table === "favorites") {
      return { upsert };
    }

    return { insert };
  });

  return {
    supabase: { from },
    from,
    insert,
    upsert,
  };
}

beforeEach(() => {
  cookieValues = new Map();
  cookieSet.mockReset();
});

describe("adoptGuestSessionData", () => {
  it("adopts guest favorites and conversions into an authenticated account", async () => {
    const favoritesCookie = serializeGuestFavoritesCookie([
      {
        createdAt: "2026-07-07T00:00:00.000Z",
        fromCurrency: "USD",
        id: "guest-favorite:USD/EUR",
        toCurrency: "EUR",
      },
    ]);
    const conversionsCookie = serializeGuestConversionsCookie([
      {
        createdAt: "2026-07-07T01:00:00.000Z",
        fromCurrency: "USD",
        id: "guest-conversion:1",
        receiveAmount: "91.20",
        sendAmount: "100",
        toCurrency: "EUR",
      },
    ]);
    cookieValues.set(GUEST_MODE_COOKIE, "1");
    cookieValues.set(GUEST_FAVORITES_COOKIE, favoritesCookie);
    cookieValues.set(GUEST_CONVERSIONS_COOKIE, conversionsCookie);
    const { adoptGuestSessionData } = await import("./adoption");
    const { insert, supabase, upsert } = createSupabaseMock();

    await adoptGuestSessionData({ supabase: supabase as never, userId: "user-1" });

    expect(upsert).toHaveBeenCalledWith(
      [
        {
          created_at: "2026-07-07T00:00:00.000Z",
          from_currency: "USD",
          to_currency: "EUR",
          user_id: "user-1",
        },
      ],
      {
        ignoreDuplicates: true,
        onConflict: "user_id,from_currency,to_currency",
      }
    );
    expect(insert).toHaveBeenCalledWith([
      {
        created_at: "2026-07-07T01:00:00.000Z",
        from_currency: "USD",
        receive_amount: "91.20",
        send_amount: "100",
        to_currency: "EUR",
        user_id: "user-1",
      },
    ]);
    expect(cookieSet).toHaveBeenCalledWith(
      GUEST_MODE_COOKIE,
      "",
      expect.objectContaining({ maxAge: 0, path: "/" })
    );
    expect(cookieSet).toHaveBeenCalledWith(
      GUEST_ALERT_DISMISSED_COOKIE,
      "",
      expect.objectContaining({ maxAge: 0, path: "/" })
    );
  });

  it("does not clear guest cookies when adoption fails", async () => {
    cookieValues.set(GUEST_MODE_COOKIE, "1");
    cookieValues.set(
      GUEST_FAVORITES_COOKIE,
      serializeGuestFavoritesCookie([
        {
          createdAt: "2026-07-07T00:00:00.000Z",
          fromCurrency: "USD",
          id: "guest-favorite:USD/EUR",
          toCurrency: "EUR",
        },
      ])
    );
    const { adoptGuestSessionData } = await import("./adoption");
    const { supabase } = createSupabaseMock({ upsertError: new Error("duplicate") });

    await expect(
      adoptGuestSessionData({ supabase: supabase as never, userId: "user-1" })
    ).rejects.toThrow("duplicate");

    expect(cookieSet).not.toHaveBeenCalled();
  });
});
