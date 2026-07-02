import { FavoriteRates } from "@/features/favorites";
import { Suspense } from "react";

export default function FavoriteRatesPage() {
  return (
    <Suspense fallback={<section aria-label="Rate details" />}>
      <FavoriteRates />
    </Suspense>
  );
}
