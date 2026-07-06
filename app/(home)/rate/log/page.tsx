import { ConversionLog } from "@/features/conversion-log";
import { getServerConversions } from "@/features/conversion-log/server";
import type { AvailableCurrency } from "@/features/converter/currencies";
import { assertDataAvailable } from "@/features/home/components/data-unavailable";
import { getCurrencyReferenceData } from "@/features/home/home-page";
import { RateDetailsRowsFallback } from "@/features/rate-details/components/rate-details-fallback";
import { Suspense } from "react";

async function ConversionLogContent() {
  const currencyReferenceData = await getCurrencyReferenceData();

  assertDataAvailable(currencyReferenceData);

  return (
    <Suspense
      fallback={<RateDetailsRowsFallback label="Conversion log" rowCount={8} variant="log" />}
    >
      <ConversionLogUserContent availableCurrencies={currencyReferenceData.availableCurrencies} />
    </Suspense>
  );
}

async function ConversionLogUserContent({
  availableCurrencies,
}: {
  availableCurrencies: AvailableCurrency[];
}) {
  const conversions = await getServerConversions();

  return <ConversionLog availableCurrencies={availableCurrencies} conversions={conversions} />;
}

export default function ConversionLogPage() {
  return (
    <Suspense
      fallback={<RateDetailsRowsFallback label="Conversion log" rowCount={8} variant="log" />}
    >
      <ConversionLogContent />
    </Suspense>
  );
}
