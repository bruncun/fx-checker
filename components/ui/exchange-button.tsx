import * as React from "react";

import { cn } from "@/lib/utils";
import { Icon } from "@/components/ui/icon";
import { interactiveSurfaceClassName } from "@/components/ui/interactive-surface";

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
      className={cn(interactiveSurfaceClassName, "p-[14px]", className)}
      type={type}
      {...props}
    >
      <Icon className="hidden size-250 sm:block" decorative iconName="exchange" />
      <Icon className="size-250 sm:hidden" decorative iconName="exchange-vertical" />
    </button>
  );
}

export { ExchangeButton };
