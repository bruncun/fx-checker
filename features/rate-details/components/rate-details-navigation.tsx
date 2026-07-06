"use client";

import { SectionNavigation, type SectionNavigationItem } from "@/components/ui/section-navigation";
import { useOptimisticConversionCount } from "@/features/conversion-log/optimistic-conversions";
import { useOptimisticFavoriteCount } from "@/features/favorites/optimistic-favorites";
import { usePathname, useSearchParams } from "next/navigation";
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
  const optimisticConversionCount = useOptimisticConversionCount(conversionCount);
  const optimisticFavoriteCount = useOptimisticFavoriteCount(favoriteCount);
  const selectedSection = getRateDetailsSectionFromPathname(pathname);
  const rateDetailsSections: SectionNavigationItem[] = rateDetailsSectionDefinitions.map(
    (section) => ({
      ...section,
      count:
        section.value === "favorites"
          ? optimisticFavoriteCount
          : section.value === "log"
            ? optimisticConversionCount
            : undefined,
      href: appendSearchParams(section.href, searchParamsString),
    })
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
