import * as React from "react";

import { cn } from "@/lib/utils";

type ShortcutBadgeProps = React.ComponentProps<"kbd">;

function ShortcutBadge({ className, ...props }: ShortcutBadgeProps) {
  return (
    <kbd
      className={cn(
        "pointer-events-none shrink-0 rounded-4 px-050 py-025 text-preset-6 text-neutral-100 shadow-[inset_0_0_0_1px_hsl(var(--neutral-500))]",
        className
      )}
      {...props}
    />
  );
}

export { ShortcutBadge };
