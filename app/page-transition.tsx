"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";

let hasHydratedPage = false;

type PageTransitionProps = {
  children: ReactNode;
};

export function PageTransition({ children }: PageTransitionProps) {
  const [shouldAnimate] = useState(() => hasHydratedPage);

  useEffect(() => {
    hasHydratedPage = true;
  }, []);

  return <div className={shouldAnimate ? "fx-page-in" : undefined}>{children}</div>;
}
