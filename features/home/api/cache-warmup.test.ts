import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { FRANKFURTER_LATEST_RATES_SOURCE_CACHE_TAG } from "@/lib/frankfurter";
import { LATEST_EXCHANGE_RATE_DATA_SNAPSHOT_CACHE_TAG } from "@/lib/latest-exchange-rate-data-snapshot";
import { warmFrankfurterCache } from "./cache-warmup";

vi.mock("server-only", () => ({}));

const {
  getCurrencyReferenceDataForLatestRates,
  getFreshLatestRatesData,
  getLiveRatesDataForLatestRates,
  getHistoryPageDataForLatestRates,
} = vi.hoisted(() => ({
  getCurrencyReferenceDataForLatestRates: vi.fn(),
  getFreshLatestRatesData: vi.fn(),
  getHistoryPageDataForLatestRates: vi.fn(),
  getLiveRatesDataForLatestRates: vi.fn(),
}));

const { getCachedLatestExchangeRateDataSnapshot, saveLatestExchangeRateDataSnapshot } = vi.hoisted(
  () => ({
    getCachedLatestExchangeRateDataSnapshot: vi.fn(),
    saveLatestExchangeRateDataSnapshot: vi.fn(),
  })
);

const { revalidateTag } = vi.hoisted(() => ({
  revalidateTag: vi.fn(),
}));

vi.mock("@/features/exchange-rates/api/server", () => ({
  getCurrencyReferenceDataForLatestRates,
  getFreshLatestRatesData,
  getLiveRatesDataForLatestRates,
}));

vi.mock("@/features/rate-history/api/server", () => ({
  getHistoryPageDataForLatestRates,
}));

vi.mock("@/lib/latest-exchange-rate-data-snapshot", () => ({
  getCachedLatestExchangeRateDataSnapshot,
  LATEST_EXCHANGE_RATE_DATA_SNAPSHOT_CACHE_TAG: "latest-exchange-rate-data-snapshot",
  saveLatestExchangeRateDataSnapshot,
}));

vi.mock("next/cache", () => ({
  revalidateTag,
}));

const sourceDate = "2026-06-19";
const fetchedAt = "2026-06-19T16:00:00.000Z";
const latestRates = [{ date: sourceDate, base: "EUR", quote: "USD", rate: 1.2 }];
const dailyRates = [{ date: "2026-03-19", base: "EUR", quote: "USD", rate: 1.16 }];
const weeklyRates = [{ date: "2025-06-19", base: "EUR", quote: "USD", rate: 1.17 }];
const monthlyRates = [{ date: "2021-06-19", base: "EUR", quote: "USD", rate: 1.18 }];

function mockSuccessfulDatasets() {
  getFreshLatestRatesData.mockResolvedValue({
    freshness: {
      dataStatus: "fresh",
      fetchedAt,
      source: "api",
    },
    rates: latestRates,
    status: "available",
  });
  getCurrencyReferenceDataForLatestRates.mockResolvedValue({
    availableCurrencies: [],
    currencyCount: 2,
    status: "available",
  });
  getLiveRatesDataForLatestRates.mockResolvedValue({
    liveRateHistoryRates: latestRates,
    liveRates: [],
    status: "available",
  });
  getHistoryPageDataForLatestRates.mockImplementation(
    (_rates: unknown, range: "1Y" | "3M" | "5Y") => {
      const historicalRates =
        range === "3M" ? dailyRates : range === "1Y" ? weeklyRates : monthlyRates;

      return Promise.resolve({ historicalRates, status: "available" });
    }
  );
  saveLatestExchangeRateDataSnapshot.mockResolvedValue(undefined);
  getCachedLatestExchangeRateDataSnapshot.mockImplementation((dataset: string) =>
    Promise.resolve({
      dataset,
      fetchedAt,
      rates:
        dataset === "latest"
          ? latestRates
          : dataset === "daily-3m"
            ? dailyRates
            : dataset === "weekly-1y"
              ? weeklyRates
              : monthlyRates,
      sourceDate,
    })
  );
}

beforeEach(() => {
  getCachedLatestExchangeRateDataSnapshot.mockReset();
  getCurrencyReferenceDataForLatestRates.mockReset();
  getFreshLatestRatesData.mockReset();
  getHistoryPageDataForLatestRates.mockReset();
  getLiveRatesDataForLatestRates.mockReset();
  revalidateTag.mockReset();
  saveLatestExchangeRateDataSnapshot.mockReset();
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "info").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("warmFrankfurterCache", () => {
  it("publishes and primes one complete snapshot after every fresh dataset succeeds", async () => {
    mockSuccessfulDatasets();

    await expect(warmFrankfurterCache()).resolves.toMatchObject({
      diagnostics: {
        historicalRates: {
          "daily-3m": { attempts: 1, rowCount: 1, status: "available" },
          "monthly-5y": { attempts: 1, rowCount: 1, status: "available" },
          "weekly-1y": { attempts: 1, rowCount: 1, status: "available" },
        },
        snapshotPublication: {
          attempts: 1,
          rowCount: 4,
          status: "available",
        },
      },
      ok: true,
      results: {
        currencyReferenceData: "available",
        historicalRates: "available",
        latestRates: "available",
        liveRates: "available",
      },
      sourceDate,
    });

    expect(revalidateTag).toHaveBeenNthCalledWith(1, FRANKFURTER_LATEST_RATES_SOURCE_CACHE_TAG, {
      expire: 0,
    });
    expect(saveLatestExchangeRateDataSnapshot).toHaveBeenCalledWith({
      fetchedAt,
      historicalRates: {
        "daily-3m": dailyRates,
        "monthly-5y": monthlyRates,
        "weekly-1y": weeklyRates,
      },
      latestRates,
      sourceDate,
    });
    expect(revalidateTag).toHaveBeenNthCalledWith(2, LATEST_EXCHANGE_RATE_DATA_SNAPSHOT_CACHE_TAG, {
      expire: 0,
    });
    expect(getCachedLatestExchangeRateDataSnapshot).toHaveBeenCalledTimes(4);
  });

  it("keeps the last published snapshot when a canonical dataset still fails after retries", async () => {
    mockSuccessfulDatasets();
    getHistoryPageDataForLatestRates.mockImplementation(
      (_rates: unknown, range: "1Y" | "3M" | "5Y") =>
        Promise.resolve(
          range === "5Y"
            ? { status: "unavailable" }
            : {
                historicalRates: range === "3M" ? dailyRates : weeklyRates,
                status: "available",
              }
        )
    );

    await expect(warmFrankfurterCache()).resolves.toMatchObject({
      diagnostics: {
        historicalRates: {
          "monthly-5y": { attempts: 3, status: "unavailable" },
        },
        snapshotPublication: { attempts: 0, status: "unavailable" },
      },
      ok: false,
      results: {
        historicalRates: "unavailable",
      },
    });

    expect(getHistoryPageDataForLatestRates).toHaveBeenCalledTimes(5);
    expect(saveLatestExchangeRateDataSnapshot).not.toHaveBeenCalled();
    expect(revalidateTag).toHaveBeenCalledTimes(1);
  });

  it("does not mistake a stale fallback for a successful fresh warmup", async () => {
    getFreshLatestRatesData.mockResolvedValue({ status: "unavailable" });

    await expect(warmFrankfurterCache()).resolves.toMatchObject({
      diagnostics: {
        latestRates: { attempts: 3, status: "unavailable" },
      },
      ok: false,
      results: {
        currencyReferenceData: "unavailable",
        historicalRates: "unavailable",
        latestRates: "unavailable",
        liveRates: "unavailable",
      },
      sourceDate: null,
    });

    expect(getFreshLatestRatesData).toHaveBeenCalledTimes(3);
    expect(getCurrencyReferenceDataForLatestRates).not.toHaveBeenCalled();
    expect(getHistoryPageDataForLatestRates).not.toHaveBeenCalled();
    expect(saveLatestExchangeRateDataSnapshot).not.toHaveBeenCalled();
  });

  it("does not invalidate the readable snapshot cache until publication succeeds", async () => {
    mockSuccessfulDatasets();
    saveLatestExchangeRateDataSnapshot.mockRejectedValue(new Error("database unavailable"));

    await expect(warmFrankfurterCache()).resolves.toMatchObject({
      diagnostics: {
        snapshotPublication: { attempts: 3, status: "unavailable" },
      },
      ok: false,
      results: {
        historicalRates: "unavailable",
      },
    });

    expect(saveLatestExchangeRateDataSnapshot).toHaveBeenCalledTimes(3);
    expect(revalidateTag).toHaveBeenCalledTimes(1);
    expect(getCachedLatestExchangeRateDataSnapshot).not.toHaveBeenCalled();
  });
});
