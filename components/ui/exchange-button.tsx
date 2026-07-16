import * as React from "react";

import { cn } from "@/lib/utils";
import { Icon } from "@/components/ui/icon";
import {
  interactiveSurfaceClassName,
  interactiveSurfaceFocusOnNeutral700ClassName,
} from "@/components/ui/interactive-surface";

export type ExchangeButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement>;

function ExchangeButton({
  "aria-label": ariaLabel = "Exchange currencies",
  className,
  type = "button",
  ...props
}: ExchangeButtonProps) {
  return (
    <button
      aria-label={ariaLabel}
      className={cn(
        interactiveSurfaceClassName,
        interactiveSurfaceFocusOnNeutral700ClassName,
        "p-[14px]",
        className
      )}
      type={type}
      {...props}
    >
      <span className="hidden leading-0 sm:block">
        <Icon className="size-250" decorative iconName="exchange" />
      </span>
      <Icon className="size-250 sm:hidden" decorative iconName="exchange-vertical" />
    </button>
  );
}

export { ExchangeButton };
