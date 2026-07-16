import * as React from "react";

import { cn } from "@/lib/utils";

const labelClassName =
  "mb-8 px-100 text-preset-5 text-neutral-200 uppercase peer-disabled:cursor-not-allowed peer-disabled:opacity-70";

const Label = React.forwardRef<HTMLLabelElement, React.ComponentPropsWithoutRef<"label">>(
  ({ className, ...props }, ref) => (
    <label ref={ref} className={cn(labelClassName, className)} {...props} />
  )
);
Label.displayName = "Label";

export { Label };
