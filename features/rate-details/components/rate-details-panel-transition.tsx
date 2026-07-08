"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

import { getRateDetailsSectionFromPathname } from "./rate-details-navigation-state";

type RateDetailsPanelTransitionProps = {
  children: ReactNode;
};

function RateDetailsPanelTransition({ children }: RateDetailsPanelTransitionProps) {
  const section = getRateDetailsSectionFromPathname(usePathname());

  return (
    <div key={section} className="fx-tab-panel-in">
      {children}
    </div>
  );
}

export { RateDetailsPanelTransition };
