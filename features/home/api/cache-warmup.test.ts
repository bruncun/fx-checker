import { beforeEach, describe, expect, it, vi } from "vitest";

import { EXCHANGE_RATES_CACHE_TAG } from "@/lib/frankfurter";
import { warmFrankfurterCache } from "./cache-warmup";

vi.mock("server-only", () => ({}));

const {
  getCurrencyReferenceDataForLatestRates,
  getLatestRatesData,
  getLiveRatesDataForLatestRates,
  getHistoryPageData,
} = vi.hoisted(() => ({
  getCurrencyReferenceDataForLatestRates: vi.fn(),
  getHistoryPageData: vi.fn(),
  getLatestRatesData: vi.fn(),
  getLiveRatesDataForLatestRates: vi.fn(),
}));

const { revalidateTag } = vi.hoisted(() => ({
  revalidateTag: vi.fn(),
}));

vi.mock("@/features/exchange-rates/api/server", () => ({
  getCurrencyReferenceDataForLatestRates,
  getLatestRatesData,
  getLiveRatesDataForLatestRates,
}));

vi.mock("@/features/rate-history/api/server", () => ({
  getHistoryPageData,
}));

vi.mock("next/cache", () => ({
  revalidateTag,
}));

beforeEach(() => {
  getCurrencyReferenceDataForLatestRates.mockReset();
  getHistoryPageData.mockReset();
  getLatestRatesData.mockReset();
  getLiveRatesDataForLatestRates.mockReset();
  revalidateTag.mockReset();
});

describe("warmFrankfurterCache", () => {
  it("expires the exchange-rate tag before warming daily data", async () => {
    const rates = [{ date: "2026-06-19", base: "EUR", quote: "USD", rate: 1.2 }];
    getLatestRatesData.mockResolvedValueOnce({ status: "available", rates });
    getCurrencyReferenceDataForLatestRates.mockResolvedValueOnce({ status: "available" });
    getLiveRatesDataForLatestRates.mockResolvedValueOnce({ status: "available" });
    getHistoryPageData.mockResolvedValueOnce({ status: "available" });

    await expect(warmFrankfurterCache()).resolves.toEqual({
      ok: true,
      results: {
        currencyReferenceData: "available",
        historicalRates: "available",
        latestRates: "available",
        liveRates: "available",
      },
    });

    expect(revalidateTag).toHaveBeenCalledWith(EXCHANGE_RATES_CACHE_TAG, { expire: 0 });
    expect(getLatestRatesData).toHaveBeenCalledTimes(1);
    expect(getCurrencyReferenceDataForLatestRates).toHaveBeenCalledWith(rates);
    expect(getLiveRatesDataForLatestRates).toHaveBeenCalledWith(rates);
  });
});
