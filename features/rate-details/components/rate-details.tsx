import type { ReactNode } from "react";
import { getRateDetailsSectionFromPathname } from "./rate-details-navigation-state";
import type { RateDetailsSection } from "./rate-details-navigation-state";

type RateDetailsProps = {
  children: ReactNode;
  navigationSlot: ReactNode;
};

function RateDetails({ children, navigationSlot }: RateDetailsProps) {
  return (
    <section aria-label="Rate details">
      {navigationSlot}
      <div className="mt-200 sm:mt-250">{children}</div>
    </section>
  );
}

export { RateDetails, getRateDetailsSectionFromPathname };
export type { RateDetailsSection };
