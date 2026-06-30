import * as React from "react";

import { cn } from "@/lib/utils";
import { Icon } from "@/components/ui/icon";
import { interactiveSurfaceClassName } from "@/components/ui/interactive-surface";

export interface FavoriteButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  pinned?: boolean;
  variant?: "default" | "icon";
}

function FavoriteButton({
  "aria-label": ariaLabel,
  className,
  disabled = false,
  pinned = false,
  type = "button",
  variant = "default",
  ...props
}: FavoriteButtonProps) {
  const label = pinned ? "Favorited" : "Favorite";
  const iconName = pinned ? "star-filled" : "star";
  const isIconVariant = variant === "icon";

  return (
    <button
      aria-label={isIconVariant ? (ariaLabel ?? label) : ariaLabel}
      aria-pressed={pinned}
      className={cn(
        interactiveSurfaceClassName,
        isIconVariant ? "p-100" : "px-150 py-100 text-preset-5-medium text-neutral-50 uppercase",
        className
      )}
      disabled={disabled}
      type={type}
      {...props}
    >
      <Icon
        className={cn(
          "size-200 self-center",
          pinned && !isIconVariant && "brightness-0",
          disabled && "brightness-0 invert-[62%]"
        )}
        decorative
        iconName={iconName}
      />
      {isIconVariant ? null : <span>{label}</span>}
    </button>
  );
}

export { FavoriteButton };
