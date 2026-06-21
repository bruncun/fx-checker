import { AppShell } from "@/components/app-shell";
import { Converter } from "@/features/converter";
import { deriveAvailableCurrencies, type AvailableCurrency } from "@/features/converter/currencies";
import { getCurrencies, getRates, type FrankfurterRate } from "@/lib/frankfurter";
import { Suspense } from "react";

type HomePageData =
  | {
      status: "available";
      availableCurrencies: AvailableCurrency[];
      currencyCount: number;
      rates: FrankfurterRate[];
    }
  | { status: "unavailable" };

async function getHomePageData(): Promise<HomePageData> {
  try {
    const [currencies, rates] = await Promise.all([getCurrencies(), getRates()]);
    const availableCurrencies = deriveAvailableCurrencies(currencies, rates);

    if (availableCurrencies.length < 2) {
      return { status: "unavailable" };
    }

    return {
      status: "available",
      availableCurrencies,
      currencyCount: availableCurrencies.length,
      rates,
    };
  } catch {
    return { status: "unavailable" };
  }
}

function ExchangeRateStats({ currencyCount }: { currencyCount: number }) {
  return (
    <ul
      className="flex items-center text-preset-6 text-neutral-200 uppercase sm:text-preset-4"
      aria-label="Exchange rate data stats"
    >
      <li>{currencyCount} Currencies</li>
      <li aria-hidden="true">&nbsp;·&nbsp;</li>
      <li>
        <abbr title="End of day">EOD</abbr>
      </li>
      <li aria-hidden="true">&nbsp;·&nbsp;</li>
      <li>
        <abbr title="European Central Bank">ECB</abbr> data
      </li>
    </ul>
  );
}

function DataUnavailable() {
  return (
    <AppShell>
      <section className="mx-auto flex min-h-[calc(100vh-88px)] max-w-[520px] flex-col items-center justify-center px-300 text-center">
        <h1 className="text-preset-2">Exchange rate data is unavailable</h1>
        <p className="mt-150 text-preset-4 text-neutral-200">
          We could not load the latest currency data. Please refresh the page in a moment.
        </p>
      </section>
    </AppShell>
  );
}

async function HomeContent() {
  const data = await getHomePageData();

  if (data.status === "unavailable") {
    return <DataUnavailable />;
  }

  return (
    <AppShell headerContent={<ExchangeRateStats currencyCount={data.currencyCount} />}>
      <Converter currencies={data.availableCurrencies} rates={data.rates} />
    </AppShell>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<AppShell />}>
      <HomeContent />
    </Suspense>
  );
}
