import {
  ConversionLog,
  ConversionLogFallback,
} from "@/features/conversion-log/components/conversion-log";
import { getServerConversions } from "@/features/conversion-log/api/server";
import type { AvailableCurrency } from "@/features/converter/model/currencies";
import { getCurrencyReferenceData } from "@/features/exchange-rates/api/server";
import { isGuestModeFromCookies } from "@/features/guest-session/model/guest-session";
import { HomePageRouteContent, type HomePageSearchParams } from "@/features/home";
import { assertDataAvailable } from "@/features/home/components/data-unavailable";
import { cookies } from "next/headers";
import type { Metadata } from "next";
import { Suspense } from "react";

type ConversionLogPageProps = {
  searchParams: HomePageSearchParams;
};

export const metadata: Metadata = {
  title: "Dashboard - Conversion Log",
};

async function ConversionLogContent() {
  const currencyReferenceData = await getCurrencyReferenceData();

  assertDataAvailable(currencyReferenceData);

  return (
    <Suspense fallback={<ConversionLogFallback />}>
      <ConversionLogUserContent availableCurrencies={currencyReferenceData.availableCurrencies} />
    </Suspense>
  );
}

async function ConversionLogUserContent({
  availableCurrencies,
}: {
  availableCurrencies: AvailableCurrency[];
}) {
  const [conversions, cookieStore] = await Promise.all([getServerConversions(), cookies()]);

  return (
    <ConversionLog
      availableCurrencies={availableCurrencies}
      conversions={conversions}
      isGuestMode={isGuestModeFromCookies(cookieStore)}
    />
  );
}

export default function ConversionLogPage({ searchParams }: ConversionLogPageProps) {
  return (
    <HomePageRouteContent searchParams={searchParams}>
      <Suspense fallback={<ConversionLogFallback />}>
        <ConversionLogContent />
      </Suspense>
    </HomePageRouteContent>
  );
}
