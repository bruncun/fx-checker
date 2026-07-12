import * as React from "react";

import { cn } from "@/lib/utils";

type PendingSpinnerProps = React.HTMLAttributes<HTMLSpanElement> & {
  indicatorClassName?: string;
  innerClassName?: string;
  size?: "md" | "lg";
};

function PendingSpinner({
  className,
  indicatorClassName,
  size = "lg",
  ...props
}: PendingSpinnerProps) {
  return (
    <span
      className={cn("relative block shrink-0", size === "lg" ? "size-500" : "size-300", className)}
      data-pending-spinner
      {...props}
    >
      <span
        aria-hidden="true"
        className={cn(
          "absolute inset-0 rounded-full border border-neutral-600 border-t-neutral-300 motion-safe:animate-spin",
          indicatorClassName
        )}
      />
    </span>
  );
}

export { PendingSpinner };
