import * as React from "react";

import { cn } from "@/lib/utils";
import { Flag, type FlagCountryCode } from "@/components/ui/flag";
import { Icon } from "@/components/ui/icon";
import { interactiveSurfaceClassName } from "@/components/ui/interactive-surface";

export interface CurrencyButtonProps extends React.ComponentProps<"button"> {
  countryCode: FlagCountryCode;
  currencyCode: string;
}

function CurrencyButton({
  "aria-label": ariaLabel = "Select currency",
  className,
  countryCode,
  currencyCode,
  type = "button",
  ...props
}: CurrencyButtonProps) {
  return (
    <button
      aria-label={ariaLabel}
      className={cn(
        interactiveSurfaceClassName,
        "h-500 w-1200 p-125 text-preset-4 text-neutral-50 uppercase",
        className
      )}
      type={type}
      {...props}
    >
      <Flag className="size-250" countryCode={countryCode} alt="" />
      <span>{currencyCode}</span>
      <Icon decorative iconName="chevron-down" />
    </button>
  );
}

export { CurrencyButton };
