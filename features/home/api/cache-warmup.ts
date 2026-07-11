import {
  getCurrencyReferenceData,
  getLatestRatesData,
  getLiveRatesData,
} from "@/features/exchange-rates/api/server";
import { getHistoryPageData } from "@/features/rate-history/api/server";

type WarmupStatus = "available" | "unavailable";

export type FrankfurterCacheWarmupResult = {
  ok: boolean;
  results: {
    currencyReferenceData: WarmupStatus;
    historicalRates: WarmupStatus;
    latestRates: WarmupStatus;
    liveRates: WarmupStatus;
  };
};

export async function warmFrankfurterCache(): Promise<FrankfurterCacheWarmupResult> {
  const latestRatesData = await getLatestRatesData();
  const [currencyReferenceData, liveRatesData, historyPageData] = await Promise.all([
    getCurrencyReferenceData(),
    getLiveRatesData(),
    getHistoryPageData({
      baseCurrency: "USD",
      quoteCurrency: "EUR",
      range: "1M",
    }),
  ]);

  const results = {
    currencyReferenceData: currencyReferenceData.status,
    historicalRates: historyPageData.status,
    latestRates: latestRatesData.status,
    liveRates: liveRatesData.status,
  };

  return {
    ok: Object.values(results).every((status) => status === "available"),
    results,
  };
}
