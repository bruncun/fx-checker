"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

import {
  getRateDetailsPanelId,
  getRateDetailsSectionFromPathname,
  getRateDetailsTabId,
} from "./rate-details-navigation-state";

type RateDetailsPanelTransitionProps = {
  children: ReactNode;
};

function RateDetailsPanelTransition({ children }: RateDetailsPanelTransitionProps) {
  const section = getRateDetailsSectionFromPathname(usePathname());

  return (
    <div
      key={section}
      aria-labelledby={getRateDetailsTabId(section)}
      className="fx-tab-panel-in"
      id={getRateDetailsPanelId(section)}
      role="tabpanel"
    >
      {children}
    </div>
  );
}

export { RateDetailsPanelTransition };
