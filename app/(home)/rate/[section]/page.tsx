import type { RateDetailsSection } from "@/features/rate-details";
import { notFound } from "next/navigation";
import { Suspense } from "react";

const rateDetailsSections = new Set(["compare", "favorites", "history", "log"]);

type RateDetailsRoutePageProps = {
  params: Promise<{
    section: string;
  }>;
};

function RateDetailsPlaceholder({ label }: { label: string }) {
  return (
    <section
      aria-label={label}
      className="mt-200 min-h-[760px] rounded-16 bg-neutral-700 px-250 py-300 text-preset-3 text-neutral-50 uppercase shadow-[inset_0_0_0_1px_hsl(var(--neutral-600))]"
    >
      {label}
    </section>
  );
}

function getRateDetailsContent(section: RateDetailsSection) {
  if (section === "compare" || section === "favorites" || section === "log") {
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
