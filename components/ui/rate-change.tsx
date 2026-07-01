import { cn } from "@/lib/utils";

type RateChangeProps = {
  className?: string;
  direction: "up" | "down";
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

  return (
    <span
      className={cn(
        "inline-flex items-center",
        isPositive ? "text-green-500" : "text-red-500",
        className
      )}
    >
      <span
        aria-hidden="true"
        className={cn("inline-flex justify-center text-[14px] leading-none", indicatorClassName)}
      >
        {showIndicator ? (
          <>
            {isPositive ? "▲" : "▼"}
            &nbsp;
          </>
        ) : null}
      </span>
      <span>{value}</span>
    </span>
  );
}

export { RateChange };
