import type { ReactNode } from "react";

import { cx } from "@/lib/cx";

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
      className={cx(
        "rounded-20 bg-neutral-700 p-200 shadow-[inset_0_0_0_1px_hsl(var(--neutral-600))] sm:p-250",
        className
      )}
    >
      <header
        className={cx(
          "flex items-center justify-between gap-200 pb-200 uppercase sm:pb-250",
          headerClassName
        )}
      >
        <h2 id={headingId} className={cx("min-w-0", headingClassName)}>
          {headingSlot}
        </h2>
        {countSlot ? <div className={cx("shrink-0", countClassName)}>{countSlot}</div> : null}
      </header>
      {children}
    </div>
  );
}

export { RateDetailsList };
export type { RateDetailsListProps };
