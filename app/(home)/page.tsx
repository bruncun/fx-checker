import { getHomePageData } from "@/features/home/home-page";
import { RateHistory, deriveRateHistoryData } from "@/features/rate-history";
import { Suspense } from "react";

const DEFAULT_SEND_CURRENCY = "USD";
const DEFAULT_RECEIVE_CURRENCY = "EUR";

type HomeProps = {
  searchParams: Promise<{
    from?: string;
    to?: string;
  }>;
};

function normalizeCurrencyCode(value: string | undefined, fallback: string) {
  const normalizedValue = value?.trim().toUpperCase();

  return normalizedValue && /^[A-Z]{3}$/.test(normalizedValue) ? normalizedValue : fallback;
}

async function HomeContent({ searchParams }: HomeProps) {
  const params = await searchParams;
  const sendCurrency = normalizeCurrencyCode(params.from, DEFAULT_SEND_CURRENCY);
  const receiveCurrency = normalizeCurrencyCode(params.to, DEFAULT_RECEIVE_CURRENCY);
  const data = await getHomePageData();

  if (data.status === "unavailable") {
    return null;
  }

  const history =
    deriveRateHistoryData({
      baseCurrency: sendCurrency,
      quoteCurrency: receiveCurrency,
      rates: data.historicalRates,
    }) ??
    deriveRateHistoryData({
      baseCurrency: DEFAULT_SEND_CURRENCY,
      quoteCurrency: DEFAULT_RECEIVE_CURRENCY,
      rates: data.historicalRates,
    });

  if (!history) {
    return null;
  }

  return <RateHistory history={history} />;
}

export default function Home({ searchParams }: HomeProps) {
  return (
    <Suspense fallback={null}>
      <HomeContent searchParams={searchParams} />
    </Suspense>
  );
}
