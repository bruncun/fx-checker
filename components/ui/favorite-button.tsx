import * as React from "react";

import { cn } from "@/lib/utils";
import { Icon } from "@/components/ui/icon";
import {
  interactiveSurfaceClassName,
  interactiveSurfaceFocusOnNeutral700ClassName,
} from "@/components/ui/interactive-surface";

export interface FavoriteButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  pinned?: boolean;
  ref?: React.Ref<HTMLButtonElement>;
  variant?: "default" | "icon";
}

function FavoriteButton({
  "aria-label": ariaLabel,
  className,
  disabled = false,
  pinned = false,
  ref,
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
        !isIconVariant && interactiveSurfaceFocusOnNeutral700ClassName,
        pinned &&
          !isIconVariant &&
          "!bg-lime-500 text-neutral-900 shadow-none hover:!bg-lime-500 hover:opacity-80",
        pinned && isIconVariant && "shadow-[inset_0_0_0_1px_hsl(var(--lime-500))]",
        !isIconVariant &&
          "disabled:!bg-neutral-600 disabled:![color:hsl(var(--neutral-200))] disabled:!opacity-100 disabled:!shadow-[inset_0_0_0_1px_hsl(var(--neutral-300))] disabled:hover:!bg-neutral-600",
        className
      )}
      disabled={disabled}
      ref={ref}
      type={type}
      {...props}
    >
      <Icon
        className={cn(
          "fx-transition-icon size-200 self-center",
          pinned && !disabled && isIconVariant && "text-lime-500",
          disabled && "text-neutral-200"
        )}
        decorative
        iconName={iconName}
      />
      {isIconVariant ? null : <span>{label}</span>}
    </button>
  );
}

export { FavoriteButton };
