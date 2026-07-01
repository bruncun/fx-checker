import { CompareRates } from "@/features/compare-rates";
import { FavoriteRates } from "@/features/favorites";
import type { RateDetailsSection } from "@/features/rate-details";
import { notFound } from "next/navigation";
import { Suspense } from "react";

const rateDetailsSections = new Set(["compare", "favorites", "history", "log"]);

type RateDetailsRoutePageProps = {
  params: Promise<{
    section: string;
  }>;
};

function getRateDetailsContent(section: RateDetailsSection) {
  if (section === "compare") {
    return <CompareRates />;
  }

  if (section === "favorites") {
    return <FavoriteRates />;
  }

  if (section === "log") {
    return null;
  }

  notFound();
}

async function RateDetailsRoute({ params }: RateDetailsRoutePageProps) {
  const { section } = await params;

  if (!rateDetailsSections.has(section) || section === "history") {
    notFound();
  }

  return getRateDetailsContent(section as RateDetailsSection);
}

export default function RateDetailsRoutePage({ params }: RateDetailsRoutePageProps) {
  return (
    <Suspense fallback={<section aria-label="Rate details" />}>
      <RateDetailsRoute params={params} />
    </Suspense>
  );
}
