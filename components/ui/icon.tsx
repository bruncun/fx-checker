import * as React from "react";

import { cx } from "@/lib/cx";

type IconAsset = {
  alt: string;
  body: React.ReactNode;
  height: number;
  viewBox: string;
  width: number;
};

export const iconAssets = {
  "arrow-right": {
    alt: "Arrow right",
    body: (
      <path d="M5.11.088c.093-.117.28-.117.398 0l4.898 4.898a.27.27 0 0 1 0 .399l-4.898 4.898c-.117.117-.305.117-.399 0l-.468-.445c-.118-.117-.118-.305 0-.399l3.632-3.656H.281A.27.27 0 0 1 0 5.502v-.656c0-.14.117-.282.281-.282h7.992L4.641.932c-.118-.094-.118-.282 0-.399z" />
    ),
    height: 11,
    viewBox: "0 0 11 11",
    width: 11,
  },
  check: {
    alt: "Check",
    body: (
      <path d="M10.207 1.957c.117-.117.305-.117.398 0l.68.656c.094.117.094.305 0 .399l-7.031 7.031a.27.27 0 0 1-.399 0L.715 6.926c-.094-.117-.094-.305 0-.399l.68-.68c.093-.093.28-.093.398 0l2.25 2.274z" />
    ),
    height: 12,
    viewBox: "0 0 12 12",
    width: 12,
  },
  "chevron-down": {
    alt: "Chevron down",
    body: (
      <path d="M2.988 4.02h6.024c.422 0 .633.515.328.82l-3 3a.48.48 0 0 1-.68 0l-3-3c-.304-.305-.093-.82.328-.82" />
    ),
    height: 12,
    viewBox: "0 0 12 12",
    width: 12,
  },
  close: {
    alt: "Close",
    body: (
      <path d="M12.773 4.287 9.06 8l3.713 3.713a.75.75 0 0 1 0 1.06.75.75 0 0 1-1.06 0L8 9.06l-3.713 3.713a.75.75 0 0 1-1.06-1.06L6.94 8 3.227 4.287a.75.75 0 0 1 1.06-1.06L8 6.94l3.713-3.713a.75.75 0 0 1 1.06 1.06Z" />
    ),
    height: 16,
    viewBox: "0 0 16 16",
    width: 16,
  },
  delete: {
    alt: "Delete",
    body: (
      <path d="M12.875 3.875c.188 0 .375.188.375.375v.375c0 .21-.187.375-.375.375H12.5l-.516 7.945c-.023.586-.539 1.055-1.125 1.055H5.117c-.586 0-1.101-.469-1.125-1.055L3.5 5h-.375a.37.37 0 0 1-.375-.375V4.25c0-.187.164-.375.375-.375h1.922l.797-1.312c.187-.305.61-.563.96-.563h2.368c.351 0 .773.258.96.563l.798 1.312zm-6.07-.75-.446.75h3.258l-.445-.75zm4.054 9.75L11.352 5H4.625l.492 7.875z" />
    ),
    height: 16,
    viewBox: "0 0 16 16",
    width: 16,
  },
  "delete-filled": {
    alt: "Delete filled",
    body: (
      <path d="M12.875 2.75c.188 0 .375.188.375.375v.75c0 .21-.187.375-.375.375h-9.75a.37.37 0 0 1-.375-.375v-.75c0-.187.164-.375.375-.375h2.813l.21-.422c.07-.187.305-.328.493-.328h2.695c.187 0 .398.14.492.328l.235.422zM3.992 12.945 3.5 5h9l-.516 7.945c-.023.586-.539 1.055-1.125 1.055H5.117c-.586 0-1.101-.469-1.125-1.055" />
    ),
    height: 16,
    viewBox: "0 0 16 16",
    width: 16,
  },
  exchange: {
    alt: "Exchange",
    body: (
      <path
        d="M6 9 2 5l4-4M2 5h16m-4 6 4 4-4 4m4-4H2"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    ),
    height: 20,
    viewBox: "0 0 20 20",
    width: 20,
  },
  "exchange-vertical": {
    alt: "Exchange vertical",
    body: (
      <path
        d="m11 6 4-4 4 4m-4-4v16m-6-4-4 4-4-4m4 4V2"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    ),
    height: 20,
    viewBox: "0 0 20 20",
    width: 20,
  },
  moon: {
    alt: "Moon",
    body: (
      <path
        d="M13.33 9.53A5.83 5.83 0 0 1 6.48 2.68 5.83 5.83 0 1 0 13.33 9.53Z"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    ),
    height: 16,
    viewBox: "0 0 16 16",
    width: 16,
  },
  search: {
    alt: "Search",
    body: (
      <path d="M13.89 15.814c.137.137.137.355 0 .465l-.628.629c-.11.136-.328.136-.465 0l-3.309-3.309a.44.44 0 0 1-.082-.246v-.355a5.76 5.76 0 0 1-3.719 1.367A5.683 5.683 0 0 1 0 8.677C0 5.56 2.543 2.99 5.688 2.99c3.117 0 5.687 2.57 5.687 5.687a5.73 5.73 0 0 1-1.395 3.719h.356c.082 0 .164.055.246.11zm-8.202-2.762a4.37 4.37 0 0 0 4.375-4.375 4.39 4.39 0 0 0-4.376-4.375 4.37 4.37 0 0 0-4.374 4.375 4.353 4.353 0 0 0 4.375 4.375" />
    ),
    height: 20,
    viewBox: "0 0 14 20",
    width: 14,
  },
  star: {
    alt: "Star",
    body: (
      <path d="M13.637 6.02c.61.094.843.844.398 1.29l-2.46 2.413.585 3.399c.094.61-.562 1.078-1.101.797l-3.047-1.617-3.07 1.617c-.54.28-1.196-.188-1.102-.797l.586-3.399L1.965 7.31c-.446-.445-.211-1.195.398-1.289l3.446-.492 1.523-3.117c.281-.563 1.078-.54 1.336 0l1.547 3.117zm-3.282 3.305 2.368-2.297-3.258-.469-1.453-2.953L6.535 6.56l-3.258.469 2.367 2.297-.562 3.234 2.93-1.523 2.906 1.523z" />
    ),
    height: 16,
    viewBox: "0 0 16 16",
    width: 16,
  },
  "star-filled": {
    alt: "Star filled",
    body: (
      <path d="M7.332 2.41c.281-.562 1.078-.538 1.336 0l1.547 3.118 3.422.492c.61.094.843.844.398 1.29l-2.46 2.413.585 3.399c.094.61-.562 1.078-1.101.797l-3.047-1.617-3.07 1.617c-.54.28-1.196-.188-1.102-.797l.586-3.399L1.965 7.31c-.446-.445-.211-1.195.398-1.289l3.446-.492z" />
    ),
    height: 16,
    viewBox: "0 0 16 16",
    width: 16,
  },
  sun: {
    alt: "Sun",
    body: (
      <g
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      >
        <path d="M8 10.67A2.67 2.67 0 1 0 8 5.33a2.67 2.67 0 0 0 0 5.34ZM8 .67V2M8 14v1.33M2.82 2.82l.94.94M12.24 12.24l.94.94M.67 8H2M14 8h1.33M2.82 13.18l.94-.94M12.24 3.76l.94-.94" />
      </g>
    ),
    height: 16,
    viewBox: "0 0 16 16",
    width: 16,
  },
  system: {
    alt: "System",
    body: (
      <path d="M2.67 2.17h10.66c.74 0 1.34.6 1.34 1.33v6.33c0 .74-.6 1.34-1.34 1.34H9.08v1.5h2.09c.23 0 .41.18.41.41v.5c0 .23-.18.42-.41.42H4.83a.42.42 0 0 1-.41-.42v-.5c0-.23.18-.41.41-.41h2.09v-1.5H2.67c-.74 0-1.34-.6-1.34-1.34V3.5c0-.73.6-1.33 1.34-1.33Zm0 1.33v5.83h10.66V3.5H2.67Z" />
    ),
    height: 16,
    viewBox: "0 0 16 16",
    width: 16,
  },
} as const satisfies Record<string, IconAsset>;

export type IconName = keyof typeof iconAssets;

export interface IconProps extends Omit<React.HTMLAttributes<HTMLSpanElement>, "children"> {
  alt?: string;
  decorative?: boolean;
  height?: number | string;
  iconName: IconName;
  width?: number | string;
}

function Icon({
  alt,
  className,
  decorative = false,
  height,
  iconName,
  style,
  width,
  ...props
}: IconProps) {
  const asset = iconAssets[iconName];
  const accessibleAlt = decorative ? undefined : (alt ?? asset.alt);

  return (
    <span
      aria-hidden={decorative ? true : undefined}
      aria-label={accessibleAlt}
      className={cx("inline-flex shrink-0", className)}
      role={decorative ? undefined : "img"}
      style={{
        ...style,
        height: height ?? style?.height ?? asset.height,
        width: width ?? style?.width ?? asset.width,
      }}
      {...props}
    >
      <svg
        aria-hidden="true"
        className="h-full w-full fill-current"
        focusable="false"
        height={asset.height}
        viewBox={asset.viewBox}
        width={asset.width}
        xmlns="http://www.w3.org/2000/svg"
      >
        {asset.body}
      </svg>
    </span>
  );
}

export { Icon };
