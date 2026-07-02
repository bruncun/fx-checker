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
    width: 139,
  },
  mark: {
    className: "size-[26px]",
    height: 26,
    src: "/images/auth-logo.svg",
    width: 26,
  },
} as const;

function Logo({ alt = "FX Checker", className, variant = "full", ...props }: LogoProps) {
  const logo = logoVariants[variant];

  return (
    <Image
      alt={alt}
      className={cn(logo.className, className)}
      height={logo.height}
      src={logo.src}
      width={logo.width}
      {...props}
    />
  );
}

export { Logo };
