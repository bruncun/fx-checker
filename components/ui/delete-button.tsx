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
      className={cn(interactiveSurfaceClassName, "group p-100", className)}
      ref={ref}
      type={type}
      {...props}
    >
      <Icon className="size-200 group-hover:hidden" decorative iconName="delete" />
      <Icon className="hidden size-200 group-hover:block" decorative iconName="delete-filled" />
    </button>
  );
}

export { DeleteButton };
