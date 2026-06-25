import { deriveAvailableCurrencies, type AvailableCurrency } from "@/features/converter/currencies";
import { getCurrencies, getRates, type FrankfurterRate } from "@/lib/frankfurter";
import { HomePageContent } from "./components/home-page-content";

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
      rates={data.rates}
    />
  );
}
