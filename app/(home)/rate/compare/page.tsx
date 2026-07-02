import { CompareRates } from "@/features/compare-rates";
import { Suspense } from "react";

export default function CompareRatesPage() {
  return (
    <Suspense fallback={<section aria-label="Rate details" />}>
      <CompareRates />
    </Suspense>
  );
}
