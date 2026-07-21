import { beforeEach, describe, expect, it, vi } from "vitest";

import type { FrankfurterRate } from "@/lib/frankfurter";
import { getHistoryPageData } from "./server";

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({
  cacheLife: vi.fn(),
  cacheTag: vi.fn(),
}));

const { getRates } = vi.hoisted(() => ({
  getRates: vi.fn(),
}));

const { getLatestRatesData } = vi.hoisted(() => ({
  getLatestRatesData: vi.fn(),
}));

vi.mock("@/lib/frankfurter", () => ({
  EXCHANGE_RATES_CACHE_TAG: "exchange-rates",
  getRates,
}));

vi.mock("@/features/exchange-rates/api/server", () => ({
  getLatestRatesData,
}));

const latestRates: FrankfurterRate[] = [
  { date: "2026-06-19", base: "EUR", quote: "GBP", rate: 0.86 },
  { date: "2026-06-19", base: "EUR", quote: "USD", rate: 1.2 },
];

beforeEach(() => {
  getLatestRatesData.mockReset();
  getRates.mockReset();
});

describe("rate history data loader", () => {
  it("fetches one canonical daily dataset for every range through three months", async () => {
    getLatestRatesData.mockResolvedValueOnce({
      freshness: {
        dataStatus: "fresh",
        fetchedAt: "2026-06-19T00:00:00.000Z",
        source: "api",
      },
      rates: latestRates,
      status: "available",
    });
    getRates.mockResolvedValueOnce([
      { date: "2026-05-19", base: "EUR", quote: "USD", rate: 1.18 },
      { date: "2026-06-19", base: "EUR", quote: "USD", rate: 1.2 },
    ]);

    await expect(
      getHistoryPageData({
        range: "1M",
      })
    ).resolves.toMatchObject({
      status: "available",
      historicalRates: [
        { date: "2026-05-19", base: "EUR", quote: "USD", rate: 1.18 },
        { date: "2026-06-19", base: "EUR", quote: "USD", rate: 1.2 },
      ],
    });

    expect(getRates).toHaveBeenCalledTimes(1);
    expect(getRates).toHaveBeenNthCalledWith(1, {
      from: "2026-03-19",
      group: undefined,
      quotes: ["GBP", "USD"],
      to: "2026-06-19",
    });
  });

  it("sorts and deduplicates canonical quotes so the fetch cache URL is stable", async () => {
    getLatestRatesData.mockResolvedValueOnce({
      freshness: {
        dataStatus: "fresh",
        fetchedAt: "2026-06-19T00:00:00.000Z",
        source: "api",
      },
      rates: [
        { date: "2026-06-19", base: "EUR", quote: "USD", rate: 1.2 },
        { date: "2026-06-19", base: "EUR", quote: "AFN", rate: 70 },
        { date: "2026-06-19", base: "EUR", quote: "GBP", rate: 0.86 },
        { date: "2026-06-19", base: "EUR", quote: "USD", rate: 1.2 },
      ],
      status: "available",
    });
    getRates.mockResolvedValueOnce([]);

    await expect(getHistoryPageData({ range: "1D" })).resolves.toMatchObject({
      status: "available",
    });

    expect(getRates).toHaveBeenNthCalledWith(1, {
      from: "2026-03-19",
      group: undefined,
      quotes: ["GBP", "USD"],
      to: "2026-06-19",
    });
  });

  it("fetches one canonical weekly dataset for the one-year view", async () => {
    getLatestRatesData.mockResolvedValueOnce({
      freshness: {
        dataStatus: "fresh",
        fetchedAt: "2026-06-19T00:00:00.000Z",
        source: "api",
      },
      rates: latestRates,
      status: "available",
    });
    getRates.mockResolvedValueOnce([
      { date: "2025-06-19", base: "EUR", quote: "GBP", rate: 0.84 },
      { date: "2026-06-19", base: "EUR", quote: "GBP", rate: 0.86 },
    ]);

    await expect(getHistoryPageData({ range: "1Y" })).resolves.toMatchObject({
      status: "available",
    });

    expect(getRates).toHaveBeenCalledTimes(1);
    expect(getRates).toHaveBeenCalledWith({
      from: "2025-06-19",
      group: "week",
      quotes: ["GBP", "USD"],
      to: "2026-06-19",
    });
  });

  it("fetches one canonical monthly dataset for the five-year view", async () => {
    getLatestRatesData.mockResolvedValueOnce({
      freshness: {
        dataStatus: "fresh",
        fetchedAt: "2026-06-19T00:00:00.000Z",
        source: "api",
      },
      rates: latestRates,
      status: "available",
    });
    getRates.mockResolvedValueOnce([
      { date: "2021-06-19", base: "EUR", quote: "GBP", rate: 0.84 },
      { date: "2021-06-19", base: "EUR", quote: "USD", rate: 1.19 },
      { date: "2026-06-18", base: "EUR", quote: "GBP", rate: 0.85 },
      { date: "2026-06-18", base: "EUR", quote: "USD", rate: 1.18 },
    ]);

    await expect(
      getHistoryPageData({
        range: "5Y",
      })
    ).resolves.toMatchObject({
      status: "available",
      historicalRates: [
        { date: "2021-06-19", base: "EUR", quote: "GBP", rate: 0.84 },
        { date: "2021-06-19", base: "EUR", quote: "USD", rate: 1.19 },
        { date: "2026-06-18", base: "EUR", quote: "GBP", rate: 0.85 },
        { date: "2026-06-18", base: "EUR", quote: "USD", rate: 1.18 },
      ],
    });

    expect(getRates).toHaveBeenCalledTimes(1);
    expect(getRates).toHaveBeenNthCalledWith(1, {
      from: "2021-06-19",
      group: "month",
      quotes: ["GBP", "USD"],
      to: "2026-06-19",
    });
  });

  it("does not fetch a canonical history dataset when latest rates use mixed bases", async () => {
    getLatestRatesData.mockResolvedValueOnce({
      freshness: {
        dataStatus: "fresh",
        fetchedAt: "2026-06-19T00:00:00.000Z",
        source: "api",
      },
      rates: [
        { date: "2026-06-19", base: "EUR", quote: "GBP", rate: 0.86 },
        { date: "2026-06-19", base: "USD", quote: "GBP", rate: 0.72 },
      ],
      status: "available",
    });

    await expect(getHistoryPageData({ range: "1Y" })).resolves.toEqual({
      status: "unavailable",
    });
    expect(getRates).not.toHaveBeenCalled();
  });
});
