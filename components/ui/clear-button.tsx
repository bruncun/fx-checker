import * as React from "react";

import { cn } from "@/lib/utils";
import { interactiveSurfaceClassName } from "@/components/ui/interactive-surface";

export interface ClearButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  ref?: React.Ref<HTMLButtonElement>;
}

function ClearButton({
  children = "Clear all",
  className,
  ref,
  type = "button",
  ...props
}: ClearButtonProps) {
  return (
    <button
      className={cn(
        interactiveSurfaceClassName,
        "px-150 py-100 text-preset-5 text-neutral-200 uppercase",
        className
      )}
      ref={ref}
      type={type}
      {...props}
    >
      <span>{children}</span>
    </button>
  );
}

export { ClearButton };
