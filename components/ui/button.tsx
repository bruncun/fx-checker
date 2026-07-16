import * as React from "react";

import { cn } from "@/lib/utils";

type ButtonVariant = "default" | "outline";

const buttonBaseClassName =
  "fx-transition-surface inline-flex h-400 cursor-pointer items-center justify-center gap-100 whitespace-nowrap rounded-8 px-150 py-100 text-preset-5-medium uppercase focus-visible:outline-none disabled:pointer-events-none disabled:!cursor-not-allowed disabled:!bg-transparent disabled:![color:hsl(var(--neutral-200))] disabled:!opacity-100 disabled:!shadow-[inset_0_0_0_1px_hsl(var(--neutral-300))] [&>svg]:pointer-events-none [&>svg]:size-150 [&>svg]:shrink-0";

const buttonVariantClassNames = {
  default:
    "bg-transparent text-neutral-50 shadow-[inset_0_0_0_1px_hsl(var(--lime-500))] hover:bg-lime-800 focus-visible:shadow-[inset_0_0_0_1px_hsl(var(--lime-500)),0_0_0_3px_hsl(var(--neutral-700)),0_0_0_4px_hsl(var(--lime-500))]",
  outline:
    "bg-transparent text-neutral-50 shadow-[inset_0_0_0_1px_hsl(var(--neutral-300))] hover:bg-neutral-600 focus-visible:shadow-[inset_0_0_0_1px_hsl(var(--neutral-300)),0_0_0_3px_hsl(var(--neutral-700)),0_0_0_4px_hsl(var(--lime-500))]",
} as const;

function buttonVariants({
  className,
  variant = "default",
}: {
  className?: string;
  variant?: ButtonVariant;
} = {}) {
  return cn(buttonBaseClassName, buttonVariantClassNames[variant], className);
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, ...props }, ref) => (
    <button className={buttonVariants({ variant, className })} ref={ref} {...props} />
  )
);
Button.displayName = "Button";

export { Button, buttonVariants };
