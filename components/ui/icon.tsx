import * as React from "react";
import Image from "next/image";

import { cn } from "@/lib/utils";

export const iconAssets = {
  "arrow-right": {
    alt: "Arrow right",
    height: 11,
    lightSrc: "/images/icon-arrow-right-dark.svg",
    width: 11,
  },
  check: { alt: "Check", height: 12, lightSrc: "/images/icon-check-dark.svg", width: 12 },
  "chevron-down": {
    alt: "Chevron down",
    height: 12,
    lightSrc: "/images/icon-chevron-down-dark.svg",
    width: 12,
  },
  close: { alt: "Close", height: 16, lightSrc: "/images/icon-close-dark.svg", width: 16 },
  delete: { alt: "Delete", height: 16, lightSrc: "/images/icon-delete-dark.svg", width: 16 },
  "delete-filled": {
    alt: "Delete filled",
    height: 16,
    lightSrc: "/images/icon-delete-filled-dark.svg",
    width: 16,
  },
  exchange: {
    alt: "Exchange",
    height: 20,
    lightSrc: "/images/icon-exchange-dark.svg",
    width: 20,
  },
  "exchange-vertical": {
    alt: "Exchange vertical",
    height: 20,
    lightSrc: "/images/icon-exchange-vertical-dark.svg",
    width: 20,
  },
  moon: { alt: "Moon", height: 16, lightSrc: "/images/icon-moon-dark.svg", width: 16 },
  search: { alt: "Search", height: 20, lightSrc: "/images/icon-search-dark.svg", width: 14 },
  star: { alt: "Star", height: 16, lightSrc: "/images/icon-star-dark.svg", width: 16 },
  "star-filled": {
    alt: "Star filled",
    height: 16,
    lightSrc: "/images/icon-star-filled-dark.svg",
    width: 16,
  },
  sun: { alt: "Sun", height: 16, lightSrc: "/images/icon-sun-dark.svg", width: 16 },
  system: { alt: "System", height: 16, lightSrc: "/images/icon-system-dark.svg", width: 16 },
} as const;

export type IconName = keyof typeof iconAssets;

export interface IconProps extends Omit<
  React.ComponentProps<typeof Image>,
  "alt" | "height" | "src" | "width"
> {
  alt?: string;
  decorative?: boolean;
  height?: React.ComponentProps<typeof Image>["height"];
  iconName: IconName;
  width?: React.ComponentProps<typeof Image>["width"];
}

function Icon({
  alt,
  className,
  decorative = false,
  height,
  iconName,
  width,
  ...props
}: IconProps) {
  const asset = iconAssets[iconName];
  const accessibleAlt = decorative ? "" : (alt ?? asset.alt);
  const ariaHidden = decorative ? true : undefined;
  const resolvedHeight = height ?? asset.height;
  const resolvedWidth = width ?? asset.width;

  if ("lightSrc" in asset) {
    return (
      <span className={cn("inline-flex shrink-0", className)}>
        <Image
          alt={accessibleAlt}
          aria-hidden={ariaHidden}
          className="fx-themed-icon-dark"
          height={resolvedHeight}
          src={`/images/icon-${iconName}.svg`}
          width={resolvedWidth}
          {...props}
        />
        <Image
          alt=""
          aria-hidden="true"
          className="fx-themed-icon-light"
          height={resolvedHeight}
          src={asset.lightSrc}
          width={resolvedWidth}
          {...props}
        />
      </span>
    );
  }

  return (
    <Image
      alt={accessibleAlt}
      aria-hidden={ariaHidden}
      className={className}
      height={resolvedHeight}
      src={`/images/icon-${iconName}.svg`}
      width={resolvedWidth}
      {...props}
    />
  );
}

export { Icon };
