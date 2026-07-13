import {
  getCurrencyReferenceDataForLatestRates,
  getLatestRatesData,
  getLiveRatesDataForLatestRates,
} from "@/features/exchange-rates/api/server";
import { getHistoryPageData } from "@/features/rate-history/api/server";
import { EXCHANGE_RATES_CACHE_TAG } from "@/lib/frankfurter";
import { revalidateTag } from "next/cache";

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
  revalidateTag(EXCHANGE_RATES_CACHE_TAG, { expire: 0 });

  const latestRatesData = await getLatestRatesData();
  const [currencyReferenceData, liveRatesData, historyPageData] =
    latestRatesData.status === "available"
      ? await Promise.all([
          getCurrencyReferenceDataForLatestRates(latestRatesData.rates),
          getLiveRatesDataForLatestRates(latestRatesData.rates),
          getHistoryPageData({
            baseCurrency: "USD",
            quoteCurrency: "EUR",
            range: "1M",
          }),
        ])
      : await Promise.all([
          Promise.resolve({ status: "unavailable" as const }),
          Promise.resolve({ status: "unavailable" as const }),
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
