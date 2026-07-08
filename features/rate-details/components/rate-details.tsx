import type { ReactNode } from "react";
import {
  getRateDetailsSectionFromPathname,
  type RateDetailsSection,
} from "./rate-details-navigation-state";
import { RateDetailsPanelTransition } from "./rate-details-panel-transition";

type RateDetailsProps = {
  children: ReactNode;
  navigationSlot: ReactNode;
};

function RateDetails({ children, navigationSlot }: RateDetailsProps) {
  return (
    <section aria-label="Rate details">
      {navigationSlot}
      <div className="mt-200 sm:mt-250">
        <RateDetailsPanelTransition>{children}</RateDetailsPanelTransition>
      </div>
    </section>
  );
}

export { RateDetails, getRateDetailsSectionFromPathname };
export type { RateDetailsSection };
