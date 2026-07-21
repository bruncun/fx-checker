import { beforeEach, describe, expect, it, vi } from "vitest";

import { FRANKFURTER_SOURCE_CACHE_TAG } from "@/lib/frankfurter";
import { warmFrankfurterCache } from "./cache-warmup";

vi.mock("server-only", () => ({}));

const {
  getCurrencyReferenceDataForLatestRates,
  getLatestRatesData,
  getLiveRatesDataForLatestRates,
  getHistoryPageDataForLatestRates,
} = vi.hoisted(() => ({
  getCurrencyReferenceDataForLatestRates: vi.fn(),
  getHistoryPageDataForLatestRates: vi.fn(),
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
  getHistoryPageDataForLatestRates,
}));

vi.mock("next/cache", () => ({
  revalidateTag,
}));

beforeEach(() => {
  getCurrencyReferenceDataForLatestRates.mockReset();
  getHistoryPageDataForLatestRates.mockReset();
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
    getHistoryPageDataForLatestRates.mockResolvedValue({ status: "available" });

    await expect(warmFrankfurterCache()).resolves.toEqual({
      ok: true,
      results: {
        currencyReferenceData: "available",
        historicalRates: "available",
        latestRates: "available",
        liveRates: "available",
      },
    });

    expect(revalidateTag).toHaveBeenCalledWith(FRANKFURTER_SOURCE_CACHE_TAG, { expire: 0 });
    expect(getLatestRatesData).toHaveBeenCalledTimes(1);
    expect(getCurrencyReferenceDataForLatestRates).toHaveBeenCalledWith(rates);
    expect(getLiveRatesDataForLatestRates).toHaveBeenCalledWith(rates);
    expect(getHistoryPageDataForLatestRates).toHaveBeenNthCalledWith(1, rates, "3M");
    expect(getHistoryPageDataForLatestRates).toHaveBeenNthCalledWith(2, rates, "1Y");
    expect(getHistoryPageDataForLatestRates).toHaveBeenNthCalledWith(3, rates, "5Y");
  });

  it("reports historical rates unavailable when either canonical dataset fails", async () => {
    const rates = [{ date: "2026-06-19", base: "EUR", quote: "USD", rate: 1.2 }];
    getLatestRatesData.mockResolvedValueOnce({ status: "available", rates });
    getCurrencyReferenceDataForLatestRates.mockResolvedValueOnce({ status: "available" });
    getLiveRatesDataForLatestRates.mockResolvedValueOnce({ status: "available" });
    getHistoryPageDataForLatestRates
      .mockResolvedValueOnce({ status: "available" })
      .mockResolvedValueOnce({ status: "available" })
      .mockResolvedValueOnce({ status: "unavailable" });

    await expect(warmFrankfurterCache()).resolves.toMatchObject({
      ok: false,
      results: {
        historicalRates: "unavailable",
      },
    });
  });
});
