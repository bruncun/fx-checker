import { Fragment, type ReactNode } from "react";

import { cn } from "@/lib/utils";

type InlineMetaListProps = {
  "aria-label"?: string;
  className?: string;
  items: ReactNode[];
  separatorClassName?: string;
};

function InlineMetaList({
  "aria-label": ariaLabel,
  className,
  items,
  separatorClassName,
}: InlineMetaListProps) {
  return (
    <ul aria-label={ariaLabel} className={cn("flex items-center", className)}>
      {items.map((item, index) => (
        <Fragment key={index}>
          {index > 0 ? (
            <li aria-hidden="true" className={separatorClassName}>
              &nbsp;·&nbsp;
            </li>
          ) : null}
          <li>{item}</li>
        </Fragment>
      ))}
    </ul>
  );
}

export { InlineMetaList };
