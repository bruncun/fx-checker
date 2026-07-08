import * as React from "react";

import { cn } from "@/lib/utils";
import { Icon } from "@/components/ui/icon";

export interface SearchInputProps extends Omit<React.ComponentProps<"input">, "type"> {
  inputClassName?: string;
}

function SearchInput({
  "aria-label": ariaLabel = "Search currencies",
  className,
  inputClassName,
  placeholder = "Search currencies...",
  ref,
  ...props
}: SearchInputProps) {
  return (
    <div
      className={cn(
        "fx-transition-surface flex items-center gap-125 rounded-6 border border-neutral-200 p-150 focus-within:border-lime-500",
        "has-[:disabled]:opacity-50",
        className
      )}
    >
      <Icon className="h-250 w-[14px]" decorative iconName="search" />
      <input
        aria-label={ariaLabel}
        ref={ref}
        type="search"
        className={cn(
          "min-w-0 flex-1 rounded-6 bg-transparent text-preset-5 text-neutral-50 caret-lime-500 outline-none placeholder:text-neutral-200 disabled:cursor-not-allowed [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden",
          inputClassName
        )}
        placeholder={placeholder}
        {...props}
      />
    </div>
  );
}

export { SearchInput };
