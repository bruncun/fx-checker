import * as React from "react";

import { cn } from "@/lib/utils";
import { Icon } from "@/components/ui/icon";
import { ShortcutBadge } from "@/components/ui/shortcut-badge";

export interface SearchInputProps extends Omit<React.ComponentProps<"input">, "type"> {
  inputClassName?: string;
  shortcutBadge?: string;
}

function SearchInput({
  "aria-label": ariaLabel = "Search currencies",
  className,
  inputClassName,
  placeholder = "Search currencies...",
  ref,
  shortcutBadge,
  ...props
}: SearchInputProps) {
  const inputValue = props.value ?? props.defaultValue ?? "";
  const showShortcutBadge = Boolean(shortcutBadge) && String(inputValue).length === 0;

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
      {showShortcutBadge ? (
        <ShortcutBadge aria-hidden="true" className="ml-auto">
          {shortcutBadge}
        </ShortcutBadge>
      ) : null}
    </div>
  );
}

export { SearchInput };
