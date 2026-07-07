import Image from "next/image";
import * as React from "react";

import { cn } from "@/lib/utils";

export type LogoProps = Omit<
  React.ComponentProps<typeof Image>,
  "alt" | "height" | "src" | "width"
> & {
  alt?: string;
  variant?: "full" | "mark";
};

const logoVariants = {
  full: {
    className: "h-250 w-auto sm:h-[26px]",
    height: 26,
    src: "/images/logo.svg",
    lightSrc: "/images/logo-light.svg",
    width: 139,
  },
  mark: {
    className: "size-[26px]",
    height: 26,
    src: "/images/auth-logo.svg",
    lightSrc: "/images/auth-logo-light.svg",
    width: 26,
  },
} as const;

function Logo({ alt = "FX Checker", className, variant = "full", ...props }: LogoProps) {
  const logo = logoVariants[variant];

  return (
    <span
      aria-label={alt}
      className={cn("inline-flex shrink-0", logo.className, className)}
      role="img"
    >
      <Image
        alt=""
        aria-hidden="true"
        className="fx-logo-dark h-full w-auto"
        height={logo.height}
        src={logo.src}
        width={logo.width}
        {...props}
      />
      <Image
        alt=""
        aria-hidden="true"
        className="fx-logo-light h-full w-auto"
        height={logo.height}
        src={logo.lightSrc}
        width={logo.width}
        {...props}
      />
    </span>
  );
}

export { Logo };
