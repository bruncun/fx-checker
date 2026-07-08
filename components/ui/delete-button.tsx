import * as React from "react";

import { cn } from "@/lib/utils";
import { Icon } from "@/components/ui/icon";
import { interactiveSurfaceClassName } from "@/components/ui/interactive-surface";

export interface DeleteButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  ref?: React.Ref<HTMLButtonElement>;
}

function DeleteButton({
  "aria-label": ariaLabel = "Delete",
  className,
  ref,
  type = "button",
  ...props
}: DeleteButtonProps) {
  return (
    <button
      aria-label={ariaLabel}
      className={cn(interactiveSurfaceClassName, "group relative p-100", className)}
      ref={ref}
      type={type}
      {...props}
    >
      <Icon
        className="fx-transition-icon size-200 opacity-100 group-hover:opacity-0"
        decorative
        iconName="delete"
      />
      <Icon
        className="fx-transition-icon absolute size-200 opacity-0 group-hover:opacity-100"
        decorative
        iconName="delete-filled"
      />
    </button>
  );
}

export { DeleteButton };
