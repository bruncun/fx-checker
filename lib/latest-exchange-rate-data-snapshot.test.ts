import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  getCachedLatestExchangeRateDataSnapshot,
  getLatestExchangeRateDataSnapshot,
  saveLatestExchangeRateDataSnapshot,
} from "./latest-exchange-rate-data-snapshot";
import type { FrankfurterRate } from "./frankfurter";

vi.mock("server-only", () => ({}));
const { cacheLife, cacheTag, io } = vi.hoisted(() => ({
  cacheLife: vi.fn(),
  cacheTag: vi.fn(),
  io: vi.fn(),
}));

vi.mock("next/cache", () => ({
  cacheLife,
  cacheTag,
  io,
}));

const { createClient, eq, from, maybeSingle, select, upsert } = vi.hoisted(() => {
  const maybeSingle = vi.fn();
  const eq = vi.fn(() => ({ maybeSingle }));
  const select = vi.fn(() => ({ eq }));
  const upsert = vi.fn();
  const from = vi.fn(() => ({ select, upsert }));
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

const latestRates: FrankfurterRate[] = [
  { date: "2026-07-08", base: "EUR", quote: "GBP", rate: 0.86 },
  { date: "2026-07-08", base: "EUR", quote: "USD", rate: 1.17 },
];

const historicalRates = {
  "daily-3m": [{ date: "2026-04-08", base: "EUR", quote: "USD", rate: 1.12 }, ...latestRates],
  "monthly-5y": [{ date: "2021-07-08", base: "EUR", quote: "USD", rate: 1.18 }, ...latestRates],
  "weekly-1y": [{ date: "2025-07-08", base: "EUR", quote: "USD", rate: 1.15 }, ...latestRates],
} satisfies Record<string, FrankfurterRate[]>;

beforeEach(() => {
  cacheLife.mockReset();
  cacheTag.mockReset();
  io.mockReset();
  io.mockResolvedValue(undefined);
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

describe("latest exchange rate data snapshot", () => {
  it("atomically upserts latest rates and every canonical history dataset", async () => {
    upsert.mockResolvedValueOnce({ error: null });

    await saveLatestExchangeRateDataSnapshot({
      fetchedAt: "2026-07-08T09:00:00.000Z",
      historicalRates,
      latestRates,
      sourceDate: "2026-07-08",
    });

    expect(createClient).toHaveBeenCalledWith("https://supabase.test", "service-role-key", {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
    expect(from).toHaveBeenCalledWith("latest_exchange_rate_data_snapshot");
    expect(upsert).toHaveBeenCalledWith({
      daily_3m: historicalRates["daily-3m"],
      fetched_at: "2026-07-08T09:00:00.000Z",
      id: "latest",
      latest_rates: latestRates,
      monthly_5y: historicalRates["monthly-5y"],
      source_date: "2026-07-08",
      weekly_1y: historicalRates["weekly-1y"],
    });
  });

  it("reads only the requested dataset column", async () => {
    maybeSingle.mockResolvedValueOnce({
      data: {
        fetched_at: "2026-07-08T09:00:00.000Z",
        id: "latest",
        source_date: "2026-07-08",
        weekly_1y: historicalRates["weekly-1y"],
      },
      error: null,
    });

    await expect(getLatestExchangeRateDataSnapshot("weekly-1y")).resolves.toEqual({
      dataset: "weekly-1y",
      fetchedAt: "2026-07-08T09:00:00.000Z",
      rates: historicalRates["weekly-1y"],
      sourceDate: "2026-07-08",
    });

    expect(createClient).toHaveBeenCalledWith("https://supabase.test", "publishable-key", {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
    expect(select).toHaveBeenCalledWith("id,source_date,fetched_at,weekly_1y");
    expect(eq).toHaveBeenCalledWith("id", "latest");
  });

  it("returns null when no complete data snapshot exists", async () => {
    maybeSingle.mockResolvedValueOnce({ data: null, error: null });

    await expect(getLatestExchangeRateDataSnapshot("latest")).resolves.toBeNull();
  });

  it("briefly caches read failures instead of failing a build or request", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    maybeSingle.mockResolvedValueOnce({
      data: null,
      error: { message: "relation does not exist" },
    });

    await expect(getCachedLatestExchangeRateDataSnapshot("daily-3m")).resolves.toBeNull();

    expect(cacheLife).toHaveBeenCalledWith("seconds");
    expect(consoleError).toHaveBeenCalledWith("Failed to load cached exchange rate data snapshot", {
      cause: "Failed to read latest exchange rate data snapshot",
      dataset: "daily-3m",
    });
  });

  it("rejects empty datasets before replacing the last complete snapshot", async () => {
    await expect(
      saveLatestExchangeRateDataSnapshot({
        fetchedAt: "2026-07-08T09:00:00.000Z",
        historicalRates: {
          ...historicalRates,
          "monthly-5y": [],
        },
        latestRates,
        sourceDate: "2026-07-08",
      })
    ).rejects.toThrow("Unexpected monthly-5y exchange rate data snapshot payload");

    expect(upsert).not.toHaveBeenCalled();
  });

  it("rejects malformed stored datasets", async () => {
    maybeSingle.mockResolvedValueOnce({
      data: {
        daily_3m: [{ date: "2026-07-08", base: "EUR", quote: "USD", rate: 0 }],
        fetched_at: "2026-07-08T09:00:00.000Z",
        id: "latest",
        source_date: "2026-07-08",
      },
      error: null,
    });

    await expect(getLatestExchangeRateDataSnapshot("daily-3m")).rejects.toThrow(
      "Unexpected daily-3m exchange rate data snapshot payload"
    );
  });
});
