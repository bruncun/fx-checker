import { deriveAvailableCurrencies, type AvailableCurrency } from "@/features/converter/currencies";
import { deriveLiveRates, type LiveRate } from "@/features/live-rates";
import { getCurrencies, getRates, type FrankfurterRate } from "@/lib/frankfurter";
import { HomePageContent } from "./components/home-page-content";

const LIVE_RATE_HISTORY_DAYS = 14;

type HomePageData =
  | {
      status: "available";
      availableCurrencies: AvailableCurrency[];
      currencyCount: number;
      liveRates: LiveRate[];
      rates: FrankfurterRate[];
    }
  | { status: "unavailable" };

function formatIsoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function parseIsoDate(date: string) {
  const [year, month, day] = date.split("-").map(Number);

  if (!year || !month || !day) {
    return null;
  }

  return new Date(Date.UTC(year, month - 1, day));
}

function getDateDaysBefore(date: string, days: number) {
  const targetDate = parseIsoDate(date);

  if (!targetDate) {
    return null;
  }

  targetDate.setUTCDate(targetDate.getUTCDate() - days);

  return formatIsoDate(targetDate);
}

async function getHomePageData(): Promise<HomePageData> {
  try {
    const [currencies, rates] = await Promise.all([getCurrencies(), getRates()]);
    const latestDate = rates[0]?.date;
    const historyStartDate = latestDate
      ? getDateDaysBefore(latestDate, LIVE_RATE_HISTORY_DAYS - 1)
      : null;
    const historyEndDate = latestDate ? getDateDaysBefore(latestDate, 1) : null;

    if (!latestDate || !historyStartDate || !historyEndDate) {
      return { status: "unavailable" };
    }

    const historicalRates = await getRates({
      from: historyStartDate,
      to: historyEndDate,
    });
    const availableCurrencies = deriveAvailableCurrencies(currencies, rates);

    if (availableCurrencies.length < 2) {
      return { status: "unavailable" };
    }

    const liveRates = deriveLiveRates({
      historicalRates: [...historicalRates, ...rates],
      latestRates: rates,
    });

    return {
      status: "available",
      availableCurrencies,
      currencyCount: availableCurrencies.length,
      liveRates,
      rates,
    };
  } catch {
    return { status: "unavailable" };
  }
}

function DataUnavailable() {
  return (
    <main className="text-white min-h-screen bg-neutral-900">
      <section className="mx-auto flex min-h-[calc(100vh-88px)] max-w-[520px] flex-col items-center justify-center px-300 text-center">
        <h1 className="text-preset-2">Exchange rate data is unavailable</h1>
        <p className="mt-150 text-preset-4 text-neutral-200">
          We could not load the latest currency data. Please refresh the page in a moment.
        </p>
      </section>
    </main>
  );
}

export async function HomePage() {
  const data = await getHomePageData();

  if (data.status === "unavailable") {
    return <DataUnavailable />;
  }

  return (
    <HomePageContent
      availableCurrencies={data.availableCurrencies}
      currencyCount={data.currencyCount}
      liveRates={data.liveRates}
      rates={data.rates}
    />
  );
}
