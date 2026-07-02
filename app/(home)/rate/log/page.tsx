import { ConversionLog } from "@/features/conversion-log";
import { Suspense } from "react";

export default function ConversionLogPage() {
  return (
    <Suspense fallback={<section aria-label="Rate details" />}>
      <ConversionLog />
    </Suspense>
  );
}
