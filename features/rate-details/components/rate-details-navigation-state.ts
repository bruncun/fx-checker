export type RateDetailsSection = "compare" | "favorites" | "history" | "log";

const rateDetailsSectionDefinitions = [
  { href: "/app", label: "History", value: "history" },
  { href: "/rate/compare", label: "Compare", value: "compare" },
  { href: "/rate/favorites", label: "Favorites", value: "favorites" },
  { href: "/rate/log", label: "Log", value: "log" },
] as const;

function isRateDetailsSection(value: string | null | undefined): value is RateDetailsSection {
  return rateDetailsSectionDefinitions.some((section) => section.value === value);
}

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

function getRateDetailsPanelId(section: RateDetailsSection) {
  return `rate-details-${section}-panel`;
}

function getRateDetailsTabId(section: RateDetailsSection) {
  return `rate-details-${section}-tab`;
}

export {
  appendSearchParams,
  getRateDetailsPanelId,
  getRateDetailsSectionFromPathname,
  getRateDetailsTabId,
  rateDetailsSectionDefinitions,
};
