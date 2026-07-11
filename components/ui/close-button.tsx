import * as React from "react";

import { cn } from "@/lib/utils";
import { Icon } from "./icon";

type CloseButtonProps = Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "children"> & {
  "aria-label": string;
};

const CloseButton = React.forwardRef<HTMLButtonElement, CloseButtonProps>(
  ({ className, type = "button", ...props }, ref) => (
    <button
      className={cn(
        "fx-transition-surface flex size-400 shrink-0 items-center justify-center rounded-4 text-preset-4 text-neutral-50 hover:shadow-[inset_0_0_0_1px_hsl(var(--neutral-200))] focus:shadow-[inset_0_0_0_1px_hsl(var(--lime-500))] focus:outline-none disabled:pointer-events-none disabled:opacity-60",
        className
      )}
      ref={ref}
      type={type}
      {...props}
    >
      <Icon className="size-200" decorative iconName="close" />
    </button>
  )
);
CloseButton.displayName = "CloseButton";

export { CloseButton };
