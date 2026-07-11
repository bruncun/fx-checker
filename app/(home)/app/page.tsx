import { assertDataAvailable } from "@/features/home/components/data-unavailable";
import { createUrlSearchParams, getRateHistoryUrlStateFromParams } from "@/features/home/url-state";
import { RateHistory, deriveRateHistoryData } from "@/features/rate-history";
import { deriveRateHistoryRangeViewModel } from "@/features/rate-history/rate-history-chart-model";
import { getHistoryPageData } from "@/features/rate-history/server";
import { RateHistoryFallback } from "@/features/rate-details/components/rate-details-fallback";
import { Suspense } from "react";

type HomeProps = {
  searchParams: Promise<{
    from?: string;
    range?: string;
    to?: string;
  }>;
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
