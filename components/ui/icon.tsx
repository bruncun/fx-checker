import * as React from "react";
import Image from "next/image";

export const iconAssets = {
  "arrow-right": { alt: "Arrow right", height: 11, width: 11 },
  check: { alt: "Check", height: 12, width: 12 },
  "chevron-down": { alt: "Chevron down", height: 12, width: 12 },
  delete: { alt: "Delete", height: 16, width: 16 },
  "delete-filled": { alt: "Delete filled", height: 16, width: 16 },
  exchange: { alt: "Exchange", height: 20, width: 20 },
  "exchange-vertical": { alt: "Exchange vertical", height: 20, width: 20 },
  search: { alt: "Search", height: 20, width: 14 },
  star: { alt: "Star", height: 16, width: 16 },
  "star-filled": { alt: "Star filled", height: 16, width: 16 },
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

function Icon({ alt, decorative = false, height, iconName, width, ...props }: IconProps) {
  const asset = iconAssets[iconName];

  return (
    <Image
      alt={decorative ? "" : (alt ?? asset.alt)}
      aria-hidden={decorative ? true : undefined}
      height={height ?? asset.height}
      src={`/images/icon-${iconName}.svg`}
      width={width ?? asset.width}
      {...props}
    />
  );
}

export { Icon };
