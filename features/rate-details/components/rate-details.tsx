"use client";

import { SectionNavigation, type SectionNavigationItem } from "@/components/ui/section-navigation";
import { useCompareRatesPresentation } from "@/features/compare-rates";
import { usePathname, useSearchParams } from "next/navigation";
import { useMemo, type ReactNode } from "react";

export type RateDetailsSection = "compare" | "favorites" | "history" | "log";

const rateDetailsSectionDefinitions = [
  { href: "/", label: "History", value: "history" },
  { href: "/rate/compare", label: "Compare", value: "compare" },
  { href: "/rate/favorites", label: "Favorites", value: "favorites" },
  { count: 8, href: "/rate/log", label: "Log", value: "log" },
] as const;

function isRateDetailsSection(value: string | null | undefined): value is RateDetailsSection {
  return rateDetailsSectionDefinitions.some((section) => section.value === value);
}

type RateDetailsProps = {
  children: ReactNode;
};

function getRateDetailsSectionFromPathname(pathname: string | null): RateDetailsSection {
  const nestedSection = pathname?.match(/^\/rate\/([^/]+)$/)?.[1];

  if (isRateDetailsSection(nestedSection)) {
    return nestedSection;
  }

  return "history";
}

function appendSearchParams(href: string, searchParams: string) {
  return searchParams ? `${href}?${searchParams}` : href;
}

function RateDetails({ children }: RateDetailsProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { favorites } = useCompareRatesPresentation();
  const searchParamsString = searchParams.toString();
  const selectedSection = getRateDetailsSectionFromPathname(pathname);
  const rateDetailsSections: SectionNavigationItem[] = useMemo(
    () =>
      rateDetailsSectionDefinitions.map((section) => ({
        ...section,
        count:
          section.value === "favorites"
            ? favorites.length
            : "count" in section
              ? section.count
              : undefined,
        href: appendSearchParams(section.href, searchParamsString),
      })),
    [favorites.length, searchParamsString]
  );

  return (
    <section aria-label="Rate details">
      <SectionNavigation
        aria-label="Rate details sections"
        items={rateDetailsSections}
        value={selectedSection}
      />
      <div className="mt-200 sm:mt-250" key={pathname}>
        {children}
      </div>
    </section>
  );
}

export { RateDetails, getRateDetailsSectionFromPathname };
