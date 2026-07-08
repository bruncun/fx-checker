import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "fx-transition-surface flex w-full rounded-6 border border-neutral-200 bg-transparent p-150 text-preset-5 text-neutral-50 caret-lime-500 outline-none file:border-0 file:bg-transparent file:text-preset-5-medium file:text-neutral-50 placeholder:text-neutral-200 focus-visible:border-lime-500 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
