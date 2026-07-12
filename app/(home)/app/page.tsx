import { assertDataAvailable } from "@/features/home/components/data-unavailable";
import {
  createUrlSearchParams,
  getRateHistoryUrlStateFromParams,
} from "@/features/home/utils/url-state";
import { RateHistory, deriveRateHistoryData } from "@/features/rate-history";
import { deriveRateHistoryRangeViewModel } from "@/features/rate-history/model/rate-history-chart-model";
import { getHistoryPageData } from "@/features/rate-history/api/server";
import { RateHistoryFallback } from "@/features/rate-details/components/rate-details-fallback";
import type { Metadata } from "next";
import { Suspense } from "react";

type HomeProps = {
  searchParams: Promise<{
    from?: string;
    range?: string;
    to?: string;
  }>;
};

export const metadata: Metadata = {
  title: "Dashboard - Rate History",
};

async function HomeContent({ searchParams }: HomeProps) {
  const { receiveCurrencyCode, selectedPair, selectedRange, sendCurrencyCode } =
    getRateHistoryUrlStateFromParams(createUrlSearchParams(await searchParams));
  const data = await getHistoryPageData({
    baseCurrency: sendCurrencyCode,
    quoteCurrency: receiveCurrencyCode,
    range: selectedRange,
  });

  assertDataAvailable(data);

  const history = deriveRateHistoryData({
    baseCurrency: sendCurrencyCode,
    quoteCurrency: receiveCurrencyCode,
    rates: data.historicalRates,
  });
  const model = deriveRateHistoryRangeViewModel(history, selectedRange);

  return <RateHistory model={model} pair={selectedPair} selectedRange={selectedRange} />;
}

export default function Home({ searchParams }: HomeProps) {
  return (
    <Suspense fallback={<RateHistoryFallback />}>
      <HomeContent searchParams={searchParams} />
    </Suspense>
  );
}
