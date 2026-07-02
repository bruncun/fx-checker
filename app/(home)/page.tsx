import { getHomePageData } from "@/features/home/home-page";
import {
  RateHistory,
  deriveRateHistoryData,
  historyRanges,
  type HistoryRange,
} from "@/features/rate-history";
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
  const data = await getHomePageData();

  if (data.status === "unavailable") {
    return null;
  }

  const pair = `${sendCurrency}/${receiveCurrency}`;
  const history = deriveRateHistoryData({
    baseCurrency: sendCurrency,
    quoteCurrency: receiveCurrency,
    rates: data.historicalRates,
  });

  return <RateHistory history={history} pair={pair} selectedRange={selectedRange} />;
}

export default function Home({ searchParams }: HomeProps) {
  return (
    <Suspense fallback={null}>
      <HomeContent searchParams={searchParams} />
    </Suspense>
  );
}
