import { beforeEach, describe, expect, it, vi } from "vitest";

import type { FrankfurterCurrency, FrankfurterRate } from "@/lib/frankfurter";
import {
  getCurrencyReferenceData,
  getLatestRatesData,
  getHistoryPageData,
  getLiveRatesData,
  getYearlyDateRanges,
} from "./home-page";

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({
  cacheLife: vi.fn(),
}));

const { getCurrencies, getRates } = vi.hoisted(() => ({
  getCurrencies: vi.fn(),
  getRates: vi.fn(),
}));

const { getLatestExchangeRateSnapshot, saveLatestExchangeRateSnapshot } = vi.hoisted(() => ({
  getLatestExchangeRateSnapshot: vi.fn(),
  saveLatestExchangeRateSnapshot: vi.fn(),
}));

vi.mock("@/lib/frankfurter", () => ({
  getCurrencies,
  getRates,
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
  getCurrencies.mockReset();
  getLatestExchangeRateSnapshot.mockReset();
  getRates.mockReset();
  saveLatestExchangeRateSnapshot.mockReset();
});

describe("getYearlyDateRanges", () => {
  it("splits a five-year inclusive history window into five non-overlapping requests", () => {
    expect(getYearlyDateRanges({ from: "2021-06-19", to: "2026-06-19", years: 5 })).toEqual([
      { from: "2021-06-19", to: "2022-06-18" },
      { from: "2022-06-19", to: "2023-06-18" },
      { from: "2023-06-19", to: "2024-06-18" },
      { from: "2024-06-19", to: "2025-06-18" },
      { from: "2025-06-19", to: "2026-06-19" },
    ]);
  });
});

describe("home page data loaders", () => {
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
    expect(getLatestExchangeRateSnapshot).not.toHaveBeenCalled();
  });

  it("falls back to the latest known good snapshot when latest rates are unavailable", async () => {
    getRates.mockRejectedValueOnce(new Error("upstream unavailable"));
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

  it("fetches five yearly historical rate ranges instead of one oversized cache item", async () => {
    getRates
      .mockResolvedValueOnce(latestRates)
      .mockResolvedValueOnce([
        { date: "2021-06-19", base: "EUR", quote: "GBP", rate: 0.84 },
        { date: "2021-06-19", base: "EUR", quote: "USD", rate: 1.19 },
      ])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        { date: "2026-06-18", base: "EUR", quote: "GBP", rate: 0.85 },
        { date: "2026-06-18", base: "EUR", quote: "USD", rate: 1.18 },
      ]);

    await expect(getHistoryPageData()).resolves.toMatchObject({
      status: "available",
      historicalRates: [
        { date: "2021-06-19", base: "EUR", quote: "GBP", rate: 0.84 },
        { date: "2021-06-19", base: "EUR", quote: "USD", rate: 1.19 },
        { date: "2026-06-18", base: "EUR", quote: "GBP", rate: 0.85 },
        { date: "2026-06-18", base: "EUR", quote: "USD", rate: 1.18 },
      ],
    });

    expect(getRates).toHaveBeenCalledTimes(6);
    expect(getRates).toHaveBeenNthCalledWith(1);
    expect(getRates).toHaveBeenNthCalledWith(2, {
      from: "2021-06-19",
      to: "2022-06-18",
    });
    expect(getRates).toHaveBeenNthCalledWith(3, {
      from: "2022-06-19",
      to: "2023-06-18",
    });
    expect(getRates).toHaveBeenNthCalledWith(4, {
      from: "2023-06-19",
      to: "2024-06-18",
    });
    expect(getRates).toHaveBeenNthCalledWith(5, {
      from: "2024-06-19",
      to: "2025-06-18",
    });
    expect(getRates).toHaveBeenNthCalledWith(6, {
      from: "2025-06-19",
      to: "2026-06-19",
    });
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
