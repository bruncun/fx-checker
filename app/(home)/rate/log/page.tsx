import { ConversionLog } from "@/features/conversion-log";
import { getServerConversions } from "@/features/conversion-log/server";
import type { AvailableCurrency } from "@/features/converter/currencies";
import { getCurrencyReferenceData } from "@/features/home/home-page";
import { RateDetailsRowsFallback } from "@/features/rate-details/components/rate-details-fallback";
import { Suspense } from "react";

async function ConversionLogContent() {
  const currencyReferenceData = await getCurrencyReferenceData();

  if (currencyReferenceData.status === "unavailable") {
    return null;
  }

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
  const conversions = await getServerConversions().catch(() => []);

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
