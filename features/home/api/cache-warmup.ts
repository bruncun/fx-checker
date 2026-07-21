import {
  getCurrencyReferenceDataForLatestRates,
  getLatestRatesData,
  getLiveRatesDataForLatestRates,
} from "@/features/exchange-rates/api/server";
import { getHistoryPageDataForLatestRates } from "@/features/rate-history/api/server";
import { FRANKFURTER_SOURCE_CACHE_TAG } from "@/lib/frankfurter";
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
  revalidateTag(FRANKFURTER_SOURCE_CACHE_TAG, { expire: 0 });

  const latestRatesData = await getLatestRatesData();
  const [
    currencyReferenceData,
    liveRatesData,
    dailyHistoryData,
    oneYearHistoryData,
    fiveYearHistoryData,
  ] =
    latestRatesData.status === "available"
      ? await Promise.all([
          getCurrencyReferenceDataForLatestRates(latestRatesData.rates),
          getLiveRatesDataForLatestRates(latestRatesData.rates),
          getHistoryPageDataForLatestRates(latestRatesData.rates, "3M"),
          getHistoryPageDataForLatestRates(latestRatesData.rates, "1Y"),
          getHistoryPageDataForLatestRates(latestRatesData.rates, "5Y"),
        ])
      : await Promise.all([
          Promise.resolve({ status: "unavailable" as const }),
          Promise.resolve({ status: "unavailable" as const }),
          Promise.resolve({ status: "unavailable" as const }),
          Promise.resolve({ status: "unavailable" as const }),
          Promise.resolve({ status: "unavailable" as const }),
        ]);

  const results = {
    currencyReferenceData: currencyReferenceData.status,
    historicalRates:
      dailyHistoryData.status === "available" &&
      oneYearHistoryData.status === "available" &&
      fiveYearHistoryData.status === "available"
        ? ("available" as const)
        : ("unavailable" as const),
    latestRates: latestRatesData.status,
    liveRates: liveRatesData.status,
  };

  return {
    ok: Object.values(results).every((status) => status === "available"),
    results,
  };
}
