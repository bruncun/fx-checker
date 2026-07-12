"use client";

import { SectionNavigation, type SectionNavigationItem } from "@/components/ui/section-navigation";
import { useOptimisticConversionCount } from "@/features/conversion-log/stores/optimistic-conversions";
import { useOptimisticFavoriteCount } from "@/features/favorites/stores/optimistic-favorites";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  appendSearchParams,
  getRateDetailsPanelId,
  getRateDetailsSectionFromPathname,
  getRateDetailsTabId,
  rateDetailsSectionDefinitions,
} from "./rate-details-navigation-state";

type RateDetailsNavigationProps = {
  conversionCount: number;
  favoriteCount: number;
};

function RateDetailsNavigation({ conversionCount, favoriteCount }: RateDetailsNavigationProps) {
  const pathname = usePathname();
  const router = useRouter();
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
      panelId: getRateDetailsPanelId(section.value),
      tabId: getRateDetailsTabId(section.value),
    })
  );

  return (
    <SectionNavigation
      items={rateDetailsSections}
      onTabActivate={(item) => {
        router.push(item.href, { scroll: false });
      }}
      value={selectedSection}
    />
  );
}

export { RateDetailsNavigation };
