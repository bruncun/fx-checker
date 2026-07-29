import { beforeEach, describe, expect, it, vi } from "vitest";

import type { FrankfurterCurrency, FrankfurterRate } from "@/lib/frankfurter";
import { getCurrencyReferenceData, getLatestRatesData, getLiveRatesData } from "./server";

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({
  cacheLife: vi.fn(),
  cacheTag: vi.fn(),
}));
vi.mock("next/server", () => ({
  after: (callback: () => unknown) => callback(),
}));

const { getCurrencies, getRates } = vi.hoisted(() => ({
  getCurrencies: vi.fn(),
  getRates: vi.fn(),
}));

const { getLatestExchangeRateSnapshot, saveLatestExchangeRateSnapshot } = vi.hoisted(() => ({
  getLatestExchangeRateSnapshot: vi.fn(),
  saveLatestExchangeRateSnapshot: vi.fn(),
}));

const { getCachedLatestExchangeRateDataSnapshot } = vi.hoisted(() => ({
  getCachedLatestExchangeRateDataSnapshot: vi.fn(),
}));

vi.mock("@/lib/frankfurter", () => ({
  EXCHANGE_RATES_CACHE_TAG: "exchange-rates",
  FRANKFURTER_LATEST_RATES_SOURCE_CACHE_TAG: "frankfurter-latest-rates-source",
  getCurrencies,
  getRates,
}));

vi.mock("@/lib/latest-exchange-rate-data-snapshot", () => ({
  getCachedLatestExchangeRateDataSnapshot,
}));

vi.mock("@/lib/latest-exchange-rate-snapshot", () => ({
  getLatestExchangeRateSnapshot,
  saveLatestExchangeRateSnapshot,
}));

const currencies: FrankfurterCurrency[] = [
  { iso_code: "EUR", name: "Euro" },
  { iso_code: "GBP", name: "British Pound" },
  { iso_code: "USD", name: "US Dollar" },
];

const latestRates: FrankfurterRate[] = [
  { date: "2026-06-19", base: "EUR", quote: "GBP", rate: 0.86 },
  { date: "2026-06-19", base: "EUR", quote: "USD", rate: 1.2 },
];

beforeEach(() => {
  getCachedLatestExchangeRateDataSnapshot.mockReset();
  getCurrencies.mockReset();
  getLatestExchangeRateSnapshot.mockReset();
  getRates.mockReset();
  saveLatestExchangeRateSnapshot.mockReset();
  getCachedLatestExchangeRateDataSnapshot.mockResolvedValue(null);
  getLatestExchangeRateSnapshot.mockResolvedValue(null);
});

describe("exchange rate data loaders", () => {
  it("serves the complete materialized snapshot without calling Frankfurter", async () => {
    const fetchedAt = new Date().toISOString();
    getCachedLatestExchangeRateDataSnapshot.mockResolvedValueOnce({
      dataset: "latest",
      fetchedAt,
      rates: latestRates,
      sourceDate: "2026-06-19",
    });

    await expect(getLatestRatesData()).resolves.toEqual({
      freshness: {
        dataStatus: "fresh",
        fetchedAt,
        source: "api",
      },
      rates: latestRates,
      status: "available",
    });

    expect(getCachedLatestExchangeRateDataSnapshot).toHaveBeenCalledWith("latest");
    expect(getLatestExchangeRateSnapshot).not.toHaveBeenCalled();
    expect(getRates).not.toHaveBeenCalled();
  });

  it("returns fresh latest rates and saves the latest known good snapshot", async () => {
    getRates.mockResolvedValueOnce(latestRates);

    await expect(getLatestRatesData()).resolves.toMatchObject({
      freshness: {
        dataStatus: "fresh",
        source: "api",
      },
      rates: latestRates,
      status: "available",
    });

    expect(saveLatestExchangeRateSnapshot).toHaveBeenCalledWith(latestRates, expect.any(String));
    expect(getLatestExchangeRateSnapshot).toHaveBeenCalledTimes(1);
  });

  it("falls back to the latest known good snapshot when latest rates are unavailable", async () => {
    getLatestExchangeRateSnapshot.mockResolvedValueOnce({
      fetchedAt: "2026-07-08T09:00:00.000Z",
      rates: latestRates,
      sourceUpdatedAt: "2026-07-08T00:00:00.000Z",
    });

    await expect(getLatestRatesData()).resolves.toEqual({
      freshness: {
        dataStatus: "stale",
        fetchedAt: "2026-07-08T09:00:00.000Z",
        source: "last_known_good",
      },
      rates: latestRates,
      status: "available",
    });

    expect(saveLatestExchangeRateSnapshot).not.toHaveBeenCalled();
    expect(getRates).not.toHaveBeenCalled();
  });

  it("returns unavailable when latest rates fail and no snapshot exists", async () => {
    getRates.mockRejectedValueOnce(new Error("upstream unavailable"));
    getLatestExchangeRateSnapshot.mockResolvedValueOnce(null);

    await expect(getLatestRatesData()).resolves.toEqual({ status: "unavailable" });
  });

  it("fetches only currencies and latest rates for currency reference data", async () => {
    getCurrencies.mockResolvedValue(currencies);
    getRates.mockResolvedValueOnce(latestRates);

    await expect(getCurrencyReferenceData()).resolves.toMatchObject({
      status: "available",
      currencyCount: 3,
    });

    expect(getCurrencies).toHaveBeenCalledTimes(1);
    expect(getRates).toHaveBeenCalledTimes(1);
    expect(getRates).toHaveBeenNthCalledWith(1);
  });

  it("fetches a short lookback range for live-rate data", async () => {
    getRates
      .mockResolvedValueOnce(latestRates)
      .mockResolvedValueOnce([
        { date: "2026-06-18", base: "EUR", quote: "GBP", rate: 0.85 },
        { date: "2026-06-18", base: "EUR", quote: "USD", rate: 1.18 },
        ...latestRates,
      ]);

    await expect(getLiveRatesData()).resolves.toMatchObject({
      status: "available",
      liveRateHistoryRates: [
        { date: "2026-06-18", base: "EUR", quote: "GBP", rate: 0.85 },
        { date: "2026-06-18", base: "EUR", quote: "USD", rate: 1.18 },
      ],
    });

    expect(getRates).toHaveBeenCalledTimes(2);
    expect(getRates).toHaveBeenNthCalledWith(1);
    expect(getRates).toHaveBeenNthCalledWith(2, {
      from: "2026-06-12",
      to: "2026-06-19",
    });
  });
});
