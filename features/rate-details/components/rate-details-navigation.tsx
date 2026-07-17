"use client";

import { SectionNavigation, type SectionNavigationItem } from "@/components/ui/section-navigation";
import { useOptimisticConversionCount } from "@/features/conversion-log/stores/optimistic-conversions";
import { useOptimisticFavoriteCount } from "@/features/favorites/stores/optimistic-favorites";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
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

let pendingKeyboardFocusSection: string | null = null;

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

  useEffect(() => {
    if (pendingKeyboardFocusSection !== selectedSection) {
      return;
    }

    pendingKeyboardFocusSection = null;

    requestAnimationFrame(() => {
      document.getElementById(getRateDetailsTabId(selectedSection))?.focus({ preventScroll: true });
    });
  }, [selectedSection]);

  return (
    <SectionNavigation
      items={rateDetailsSections}
      onTabActivate={(item) => {
        pendingKeyboardFocusSection = item.value;
        router.push(item.href, { scroll: false });
      }}
      value={selectedSection}
    />
  );
}

export { RateDetailsNavigation };
