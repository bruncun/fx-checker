import { ConversionLog } from "@/features/conversion-log";
import { getServerConversions } from "@/features/conversion-log/server";
import { getCurrencyReferenceData } from "@/features/home/home-page";
import { Suspense } from "react";

async function ConversionLogContent() {
  const [currencyReferenceData, conversions] = await Promise.all([
    getCurrencyReferenceData(),
    getServerConversions().catch(() => []),
  ]);

  if (currencyReferenceData.status === "unavailable") {
    return null;
  }

  return (
    <ConversionLog
      availableCurrencies={currencyReferenceData.availableCurrencies}
      conversions={conversions}
    />
  );
}

export default function ConversionLogPage() {
  return (
    <Suspense fallback={<section aria-label="Rate details" />}>
      <ConversionLogContent />
    </Suspense>
  );
}
