import { Fragment, type ReactNode } from "react";

import { cn } from "@/lib/utils";

type InlineMetaListItem = ReactNode | { className?: string; content: ReactNode };

type InlineMetaListProps = {
  "aria-label"?: string;
  "aria-live"?: "assertive" | "off" | "polite";
  "aria-atomic"?: boolean | "false" | "true";
  className?: string;
  items: InlineMetaListItem[];
  separatorClassName?: string;
};

function getItemContent(item: InlineMetaListItem) {
  return isConfiguredItem(item) ? item.content : item;
}

function getItemClassName(item: InlineMetaListItem) {
  return isConfiguredItem(item) ? item.className : undefined;
}

function isConfiguredItem(
  item: InlineMetaListItem
): item is { className?: string; content: ReactNode } {
  return typeof item === "object" && item !== null && !Array.isArray(item) && "content" in item;
}

function InlineMetaList({
  "aria-atomic": ariaAtomic,
  "aria-label": ariaLabel,
  "aria-live": ariaLive,
  className,
  items,
  separatorClassName,
}: InlineMetaListProps) {
  return (
    <ul
      aria-atomic={ariaAtomic}
      aria-label={ariaLabel}
      aria-live={ariaLive}
      className={cn("flex items-center", className)}
    >
      {items.map((item, index) => (
        <Fragment key={index}>
          {index > 0 ? (
            <li aria-hidden="true" className={cn(separatorClassName, getItemClassName(item))}>
              &nbsp;·&nbsp;
            </li>
          ) : null}
          <li className={getItemClassName(item)}>{getItemContent(item)}</li>
        </Fragment>
      ))}
    </ul>
  );
}

export { InlineMetaList };
