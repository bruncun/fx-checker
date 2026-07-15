import type { ReactNode } from "react";

import { cx } from "@/lib/cx";

type TabEmptyStateProps = {
  className?: string;
  lead: ReactNode;
  title: ReactNode;
};

function TabEmptyState({ className, lead, title }: TabEmptyStateProps) {
  return (
    <div className={cx("py-500 text-center", className)}>
      <h2 className="text-preset-2 text-neutral-100">{title}</h2>
      <p className="mx-auto mt-200 text-preset-4 text-neutral-200">{lead}</p>
    </div>
  );
}

export { TabEmptyState };
