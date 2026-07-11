import { beforeEach, describe, expect, it, vi } from "vitest";

import type { FrankfurterRate } from "@/lib/frankfurter";
import { getHistoryPageData, getYearlyDateRanges } from "./server";

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({
  cacheLife: vi.fn(),
}));

const { getRates } = vi.hoisted(() => ({
  getRates: vi.fn(),
}));

const { getLatestRatesData } = vi.hoisted(() => ({
  getLatestRatesData: vi.fn(),
}));

vi.mock("@/lib/frankfurter", () => ({
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

describe("rate history data loader", () => {
  it("fetches only the selected short history range and current pair quotes", async () => {
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
        baseCurrency: "USD",
        quoteCurrency: "EUR",
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
      from: "2026-05-19",
      quotes: ["USD"],
      to: "2026-06-19",
    });
  });

  it("uses one fallback quote for provider-base same-currency history requests", async () => {
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
      { date: "2026-06-12", base: "EUR", quote: "GBP", rate: 0.85 },
      { date: "2026-06-19", base: "EUR", quote: "GBP", rate: 0.86 },
    ]);

    await expect(
      getHistoryPageData({
        baseCurrency: "EUR",
        quoteCurrency: "EUR",
        range: "1W",
      })
    ).resolves.toMatchObject({
      status: "available",
    });

    expect(getRates).toHaveBeenNthCalledWith(1, {
      from: "2026-06-12",
      quotes: ["GBP"],
      to: "2026-06-19",
    });
  });

  it("fetches five yearly historical rate ranges only for the five-year view", async () => {
    getLatestRatesData.mockResolvedValueOnce({
      freshness: {
        dataStatus: "fresh",
        fetchedAt: "2026-06-19T00:00:00.000Z",
        source: "api",
      },
      rates: latestRates,
      status: "available",
    });
    getRates
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

    await expect(
      getHistoryPageData({
        baseCurrency: "GBP",
        quoteCurrency: "USD",
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

    expect(getRates).toHaveBeenCalledTimes(5);
    expect(getRates).toHaveBeenNthCalledWith(1, {
      from: "2021-06-19",
      quotes: ["GBP", "USD"],
      to: "2022-06-18",
    });
    expect(getRates).toHaveBeenNthCalledWith(2, {
      from: "2022-06-19",
      quotes: ["GBP", "USD"],
      to: "2023-06-18",
    });
    expect(getRates).toHaveBeenNthCalledWith(3, {
      from: "2023-06-19",
      quotes: ["GBP", "USD"],
      to: "2024-06-18",
    });
    expect(getRates).toHaveBeenNthCalledWith(4, {
      from: "2024-06-19",
      quotes: ["GBP", "USD"],
      to: "2025-06-18",
    });
    expect(getRates).toHaveBeenNthCalledWith(5, {
      from: "2025-06-19",
      quotes: ["GBP", "USD"],
      to: "2026-06-19",
    });
  });
});
