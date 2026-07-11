import { describe, expect, it, vi } from "vitest";

import { GUEST_FAVORITES_COOKIE } from "@/features/guest-session/model/guest-session";
import { createGuestFavoriteStore } from "../stores/store";

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

describe("guest favorite store", () => {
  it("creates, de-duplicates, lists, and deletes guest favorites through cookies", async () => {
    const cookieStore = createCookieStore();
    const store = createGuestFavoriteStore(cookieStore);

    const favorite = await store.create({ fromCurrency: " usd ", toCurrency: "eur" });
    const duplicateFavorite = await store.create({ fromCurrency: "USD", toCurrency: "EUR" });

    expect(duplicateFavorite).toEqual(favorite);
    await expect(store.list()).resolves.toEqual([favorite]);
    expect(cookieStore.get(GUEST_FAVORITES_COOKIE)?.value).toBeDefined();

    await store.delete({ fromCurrency: "USD", toCurrency: "EUR" });

    await expect(store.list()).resolves.toEqual([]);
  });
});
