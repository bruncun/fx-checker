import * as React from "react";

import { cn } from "@/lib/utils";
import { Icon } from "@/components/ui/icon";

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
        "inline-flex h-400 items-center justify-center gap-100 rounded-8 bg-transparent px-150 py-100 text-preset-5-medium text-neutral-50 uppercase shadow-[inset_0_0_0_1px_hsl(var(--lime-500))] hover:bg-lime-800 focus-visible:shadow-[inset_0_0_0_1px_hsl(var(--lime-500)),0_0_0_3px_hsl(var(--neutral-700)),0_0_0_4px_hsl(var(--lime-500))] focus-visible:outline-none disabled:pointer-events-none disabled:!bg-transparent disabled:![color:hsl(var(--neutral-200))] disabled:!opacity-100 disabled:!shadow-[inset_0_0_0_1px_hsl(var(--neutral-300))]",
        pressed && "!bg-lime-500 text-neutral-900 shadow-none hover:!bg-lime-500 hover:opacity-80",
        className
      )}
      type={type}
      {...props}
    >
      {pressed ? <Icon className="size-200 brightness-0" decorative iconName="check" /> : null}
      <span>{pressed ? "Logged" : "Log conversion"}</span>
    </button>
  );
}

export { LogConversionButton };
