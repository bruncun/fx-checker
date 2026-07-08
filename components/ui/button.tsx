import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "fx-transition-surface inline-flex cursor-pointer items-center justify-center gap-100 whitespace-nowrap rounded-8 text-preset-5-medium uppercase focus-visible:outline-none disabled:pointer-events-none disabled:!cursor-not-allowed disabled:!bg-transparent disabled:![color:hsl(var(--neutral-200))] disabled:!opacity-100 disabled:!shadow-[inset_0_0_0_1px_hsl(var(--neutral-300))] [&_svg]:pointer-events-none [&_svg]:size-150 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-transparent text-neutral-50 shadow-[inset_0_0_0_1px_hsl(var(--lime-500))] hover:bg-lime-800 focus-visible:shadow-[inset_0_0_0_1px_hsl(var(--lime-500)),0_0_0_3px_hsl(var(--neutral-700)),0_0_0_4px_hsl(var(--lime-500))]",
        destructive: "bg-destructive text-destructive-foreground shadow-xs hover:bg-destructive/90",
        outline:
          "bg-transparent text-neutral-50 shadow-[inset_0_0_0_1px_hsl(var(--neutral-300))] hover:bg-neutral-600 focus-visible:shadow-[inset_0_0_0_1px_hsl(var(--neutral-300)),0_0_0_3px_hsl(var(--neutral-700)),0_0_0_4px_hsl(var(--lime-500))]",
        secondary: "bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80",
        ghost:
          "text-neutral-100 hover:bg-neutral-500 hover:text-neutral-50 focus-visible:shadow-[0_0_0_3px_hsl(var(--neutral-600)),0_0_0_4px_hsl(var(--lime-500))]",
        link: "text-lime-500 underline-offset-4 hover:underline",
      },
      size: {
        default: "h-400 px-150 py-100",
        sm: "h-400 rounded-8 px-150",
        lg: "h-600 rounded-8 px-600 py-150",
        icon: "h-500 w-500",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
  )
);
Button.displayName = "Button";

export { Button, buttonVariants };
