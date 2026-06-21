import Image from "next/image";
import * as React from "react";

import { cn } from "@/lib/utils";

export type LogoProps = Omit<
  React.ComponentProps<typeof Image>,
  "alt" | "height" | "src" | "width"
> & {
  alt?: string;
};

function Logo({ alt = "FX Checker", className, ...props }: LogoProps) {
  return (
    <Image
      alt={alt}
      className={cn("h-250 w-auto sm:h-[26px]", className)}
      height={26}
      src="/images/logo.svg"
      width={139}
      {...props}
    />
  );
}

export { Logo };
