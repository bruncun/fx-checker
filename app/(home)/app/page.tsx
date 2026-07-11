import { assertDataAvailable } from "@/features/home/components/data-unavailable";
import {
  RateHistory,
  deriveRateHistoryData,
  historyRanges,
  type HistoryRange,
} from "@/features/rate-history";
import { deriveRateHistoryRangeViewModel } from "@/features/rate-history/rate-history-chart-model";
import { getHistoryPageData } from "@/features/rate-history/server";
import { RateHistoryFallback } from "@/features/rate-details/components/rate-details-fallback";
import { Suspense } from "react";

const DEFAULT_SEND_CURRENCY = "USD";
const DEFAULT_RECEIVE_CURRENCY = "EUR";

type HomeProps = {
  searchParams: Promise<{
    from?: string;
    range?: string;
    to?: string;
  }>;
};

function normalizeCurrencyCode(value: string | undefined, fallback: string) {
  const normalizedValue = value?.trim().toUpperCase();

  return normalizedValue && /^[A-Z]{3}$/.test(normalizedValue) ? normalizedValue : fallback;
}

function normalizeHistoryRange(value: string | undefined): HistoryRange {
  return historyRanges.includes(value as HistoryRange) ? (value as HistoryRange) : "1M";
}

async function HomeContent({ searchParams }: HomeProps) {
  const params = await searchParams;
  const sendCurrency = normalizeCurrencyCode(params.from, DEFAULT_SEND_CURRENCY);
  const receiveCurrency = normalizeCurrencyCode(params.to, DEFAULT_RECEIVE_CURRENCY);
  const selectedRange = normalizeHistoryRange(params.range);
  const selectedPair = `${sendCurrency}/${receiveCurrency}`;
  const data = await getHistoryPageData({
    baseCurrency: sendCurrency,
    quoteCurrency: receiveCurrency,
    range: selectedRange,
  });

  assertDataAvailable(data);

  const history = deriveRateHistoryData({
    baseCurrency: sendCurrency,
    quoteCurrency: receiveCurrency,
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
