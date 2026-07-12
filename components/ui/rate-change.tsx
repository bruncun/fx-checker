import { cn } from "@/lib/utils";

type RateChangeProps = {
  className?: string;
  direction: "up" | "down" | "neutral";
  indicatorClassName?: string;
  showIndicator?: boolean;
  value: string;
};

function RateChange({
  className,
  direction,
  indicatorClassName,
  showIndicator = true,
  value,
}: RateChangeProps) {
  const isPositive = direction === "up";
  const isNegative = direction === "down";
  const indicator = isPositive ? "▲" : isNegative ? "▼" : null;

  return (
    <span
      className={cn(
        "inline-flex items-center",
        isPositive && "text-green-500",
        isNegative && "text-red-500",
        direction === "neutral" && "text-neutral-200",
        className
      )}
    >
      <span
        aria-hidden="true"
        className={cn("inline-flex justify-center text-[14px] leading-none", indicatorClassName)}
      >
        {showIndicator && indicator ? (
          <>
            {indicator}
            &nbsp;
          </>
        ) : null}
      </span>
      <span>{value}</span>
    </span>
  );
}

export { RateChange };
