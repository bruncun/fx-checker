import { ConversionLog, ConversionLogFallback } from "@/features/conversion-log";
import { getServerConversions } from "@/features/conversion-log/api/server";
import type { AvailableCurrency } from "@/features/converter/model/currencies";
import { getCurrencyReferenceData } from "@/features/exchange-rates/api/server";
import { isGuestModeFromCookies } from "@/features/guest-session/model/guest-session";
import { assertDataAvailable } from "@/features/home/components/data-unavailable";
import { cookies } from "next/headers";
import { Suspense } from "react";

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

export default function ConversionLogPage() {
  return (
    <Suspense fallback={<ConversionLogFallback />}>
      <ConversionLogContent />
    </Suspense>
  );
}
