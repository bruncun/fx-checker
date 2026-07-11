import { describe, expect, it, vi } from "vitest";

import { GUEST_CONVERSIONS_COOKIE } from "@/features/guest-session/guest-session";
import { createGuestConversionStore } from "./store";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

function createCookieStore(initialCookies: Record<string, string> = {}) {
  const cookies = new Map(Object.entries(initialCookies));

  return {
    get(name: string) {
      const value = cookies.get(name);

      return value ? { value } : undefined;
    },
    set(name: string, value: string) {
      cookies.set(name, value);
    },
  };
}

describe("guest conversion store", () => {
  it("creates, lists, deletes, and clears guest conversions through cookies", async () => {
    const cookieStore = createCookieStore();
    const store = createGuestConversionStore(cookieStore);

    const firstConversion = await store.create({
      fromCurrency: " usd ",
      receiveAmount: " 86.50 ",
      sendAmount: " 100 ",
      toCurrency: "eur",
    });
    const secondConversion = await store.create({
      fromCurrency: "GBP",
      receiveAmount: "125",
      sendAmount: "100",
      toCurrency: "USD",
    });

    await expect(store.list()).resolves.toEqual([secondConversion, firstConversion]);
    expect(cookieStore.get(GUEST_CONVERSIONS_COOKIE)?.value).toBeDefined();

    await store.delete(firstConversion.id);

    await expect(store.list()).resolves.toEqual([secondConversion]);

    await store.deleteAll();

    await expect(store.list()).resolves.toEqual([]);
  });
});
