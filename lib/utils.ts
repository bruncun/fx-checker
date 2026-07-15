import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

const twMerge = extendTailwindMerge({
  override: {
    theme: {
      color: [
        "transparent",
        "current",
        "neutral-50",
        "neutral-100",
        "neutral-200",
        "neutral-300",
        "neutral-400",
        "neutral-500",
        "neutral-600",
        "neutral-700",
        "neutral-900",
        "lime-500",
        "lime-800",
        "green-500",
        "red-500",
        "background",
        "foreground",
        "card",
        "card-foreground",
        "popover",
        "popover-foreground",
        "primary",
        "primary-foreground",
        "secondary",
        "secondary-foreground",
        "muted",
        "muted-foreground",
        "accent",
        "accent-foreground",
        "destructive",
        "destructive-foreground",
        "border",
        "input",
        "ring",
        "chart-1",
        "chart-2",
        "chart-3",
        "chart-4",
        "chart-5",
      ],
    },
  },
  extend: {
    theme: {
      text: [
        "preset-1",
        "preset-1-tablet",
        "preset-2",
        "preset-2-bold",
        "preset-3",
        "preset-3-medium",
        "preset-3-bold",
        "preset-4",
        "preset-5",
        "preset-5-medium",
        "preset-6",
      ],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
