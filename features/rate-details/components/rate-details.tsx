"use client";

import { SectionNavigation, type SectionNavigationItem } from "@/components/ui/section-navigation";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export type RateDetailsSection = "compare" | "favorites" | "history" | "log";

const rateDetailsSectionDefinitions = [
  { href: "/", label: "History", value: "history" },
  { href: "/rate/compare", label: "Compare", value: "compare" },
  { count: 10, href: "/rate/favorites", label: "Favorites", value: "favorites" },
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

function RateDetails({ children }: RateDetailsProps) {
  const pathname = usePathname();
  const selectedSection = getRateDetailsSectionFromPathname(pathname);
  const rateDetailsSections: SectionNavigationItem[] = [...rateDetailsSectionDefinitions];

  return (
    <section aria-label="Rate details" className="uppercase">
      <SectionNavigation
        aria-label="Rate details sections"
        items={rateDetailsSections}
        value={selectedSection}
      />
      <div key={pathname}>{children}</div>
    </section>
  );
}

export { RateDetails, getRateDetailsSectionFromPathname };
