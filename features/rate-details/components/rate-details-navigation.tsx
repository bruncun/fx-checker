"use client";

import { SectionNavigation, type SectionNavigationItem } from "@/components/ui/section-navigation";
import { usePathname, useSearchParams } from "next/navigation";
import { useMemo } from "react";
import {
  appendSearchParams,
  getRateDetailsSectionFromPathname,
  rateDetailsSectionDefinitions,
} from "./rate-details-navigation-state";

type RateDetailsNavigationProps = {
  conversionCount: number;
  favoriteCount: number;
};

function RateDetailsNavigation({ conversionCount, favoriteCount }: RateDetailsNavigationProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchParamsString = searchParams.toString();
  const selectedSection = getRateDetailsSectionFromPathname(pathname);
  const rateDetailsSections: SectionNavigationItem[] = useMemo(
    () =>
      rateDetailsSectionDefinitions.map((section) => ({
        ...section,
        count:
          section.value === "favorites"
            ? favoriteCount
            : section.value === "log"
              ? conversionCount
              : undefined,
        href: appendSearchParams(section.href, searchParamsString),
      })),
    [conversionCount, favoriteCount, searchParamsString]
  );

  return (
    <SectionNavigation
      aria-label="Rate details sections"
      items={rateDetailsSections}
      value={selectedSection}
    />
  );
}

export { RateDetailsNavigation };
