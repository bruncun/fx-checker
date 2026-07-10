import type { ReactNode } from "react";

import { PageTransition } from "./page-transition";

export default function RootTemplate({ children }: { children: ReactNode }) {
  return <PageTransition>{children}</PageTransition>;
}
