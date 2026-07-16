import * as React from "react";

import { cn } from "@/lib/utils";
import { Icon } from "@/components/ui/icon";
import { buttonVariants } from "@/components/ui/button";

export interface LogConversionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  pressed?: boolean;
}

function LogConversionButton({
  className,
  pressed = false,
  type = "button",
  ...props
}: LogConversionButtonProps) {
  return (
    <button
      aria-pressed={pressed}
      className={cn(
        buttonVariants({ variant: "default" }),
        pressed && "!bg-lime-500 text-neutral-900 shadow-none hover:!bg-lime-500 hover:opacity-80",
        className
      )}
      type={type}
      {...props}
    >
      {pressed ? <Icon className="size-200" decorative iconName="check" /> : null}
      <span>{pressed ? "Logged" : "Log conversion"}</span>
    </button>
  );
}

export { LogConversionButton };
