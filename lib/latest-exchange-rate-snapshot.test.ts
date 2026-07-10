import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  getLatestExchangeRateSnapshot,
  saveLatestExchangeRateSnapshot,
} from "./latest-exchange-rate-snapshot";
import type { FrankfurterRate } from "./frankfurter";

vi.mock("server-only", () => ({}));

const { createClient, from, maybeSingle, select, eq, upsert } = vi.hoisted(() => {
  const maybeSingle = vi.fn();
  const select = vi.fn(() => ({ eq }));
  const eq = vi.fn(() => ({ maybeSingle }));
  const upsert = vi.fn();
  const from = vi.fn(() => ({ eq, select, upsert }));
  const createClient = vi.fn(() => ({ from }));

  return {
    createClient,
    eq,
    from,
    maybeSingle,
    select,
    upsert,
  };
});

vi.mock("@supabase/supabase-js", () => ({
  createClient,
}));

const rates: FrankfurterRate[] = [
  { date: "2026-07-08", base: "EUR", quote: "GBP", rate: 0.86 },
  { date: "2026-07-08", base: "EUR", quote: "USD", rate: 1.17 },
];

beforeEach(() => {
  createClient.mockClear();
  eq.mockClear();
  from.mockClear();
  maybeSingle.mockReset();
  select.mockClear();
  upsert.mockReset();
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://supabase.test");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "publishable-key");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service-role-key");
});

describe("latest exchange rate snapshot", () => {
  it("upserts the latest singleton snapshot", async () => {
    upsert.mockResolvedValueOnce({ error: null });

    await saveLatestExchangeRateSnapshot(rates, "2026-07-08T09:00:00.000Z");

    expect(createClient).toHaveBeenCalledWith("https://supabase.test", "service-role-key", {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
    expect(from).toHaveBeenCalledWith("latest_exchange_rate_snapshot");
    expect(upsert).toHaveBeenCalledWith({
      fetched_at: "2026-07-08T09:00:00.000Z",
      id: "latest",
      payload: rates,
      source_updated_at: "2026-07-08T00:00:00.000Z",
    });
  });

  it("reads and validates the latest singleton snapshot", async () => {
    maybeSingle.mockResolvedValueOnce({
      data: {
        fetched_at: "2026-07-08T09:00:00.000Z",
        id: "latest",
        payload: rates,
        source_updated_at: "2026-07-08T00:00:00.000Z",
      },
      error: null,
    });

    await expect(getLatestExchangeRateSnapshot()).resolves.toEqual({
      fetchedAt: "2026-07-08T09:00:00.000Z",
      rates,
      sourceUpdatedAt: "2026-07-08T00:00:00.000Z",
    });

    expect(createClient).toHaveBeenCalledWith("https://supabase.test", "publishable-key", {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
    expect(select).toHaveBeenCalledWith("id,payload,fetched_at,source_updated_at");
    expect(eq).toHaveBeenCalledWith("id", "latest");
  });

  it("returns null when no latest snapshot exists", async () => {
    maybeSingle.mockResolvedValueOnce({ data: null, error: null });

    await expect(getLatestExchangeRateSnapshot()).resolves.toBeNull();
  });

  it("rejects malformed snapshot payloads", async () => {
    maybeSingle.mockResolvedValueOnce({
      data: {
        fetched_at: "2026-07-08T09:00:00.000Z",
        id: "latest",
        payload: [{ date: "2026-07-08", base: "EUR", quote: "USD", rate: 0 }],
        source_updated_at: null,
      },
      error: null,
    });

    await expect(getLatestExchangeRateSnapshot()).rejects.toThrow(
      "Unexpected latest exchange rate snapshot payload"
    );
  });
});
