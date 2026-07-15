import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type RateDetailsListProps = {
  children: ReactNode;
  className?: string;
  countClassName?: string;
  countSlot?: ReactNode;
  headerClassName?: string;
  headingId: string;
  headingClassName?: string;
  headingSlot: ReactNode;
};

function RateDetailsList({
  children,
  className,
  countClassName,
  countSlot,
  headerClassName,
  headingId,
  headingClassName,
  headingSlot,
}: RateDetailsListProps) {
  return (
    <div
      className={cn(
        "rounded-20 bg-neutral-700 p-200 shadow-[inset_0_0_0_1px_hsl(var(--neutral-600))] sm:p-250",
        className
      )}
    >
      <header
        className={cn(
          "flex items-center justify-between gap-200 pb-200 uppercase sm:pb-250",
          headerClassName
        )}
      >
        <h2 id={headingId} className={cn("min-w-0", headingClassName)}>
          {headingSlot}
        </h2>
        {countSlot ? <div className={cn("shrink-0", countClassName)}>{countSlot}</div> : null}
      </header>
      {children}
    </div>
  );
}

export { RateDetailsList };
export type { RateDetailsListProps };
