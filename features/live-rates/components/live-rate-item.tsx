import { RateChange } from "@/components/ui/rate-change";

export type LiveRate = {
  pair: string;
  rate: string;
  change: string;
  direction: "up" | "down";
};

type LiveRateItemProps = {
  rate: LiveRate;
  tabIndex: 0 | -1;
  onSelect?: (rate: LiveRate) => void;
  onFocus?: (rate: LiveRate) => void;
};

export function LiveRateItem({ rate, tabIndex, onFocus, onSelect }: LiveRateItemProps) {
  const isPositive = rate.direction === "up";
  const directionLabel = isPositive ? "up" : "down";

  return (
    <li>
      <button
        type="button"
        className="relative flex items-center gap-125 p-150 text-left uppercase after:pointer-events-none after:absolute after:inset-0 after:z-10 after:border after:border-transparent hover:bg-neutral-600 focus-visible:outline-none focus-visible:after:border-lime-500 sm:h-500 sm:px-[12.5px] sm:py-[13px]"
        aria-label={`Use ${rate.pair} in converter, rate ${rate.rate}, ${directionLabel} ${rate.change}`}
        data-live-rate-option
        data-live-rate-pair={rate.pair}
        onFocus={() => onFocus?.(rate)}
        onClick={() => onSelect?.(rate)}
        tabIndex={tabIndex}
      >
        <span className="text-preset-6 text-neutral-200 sm:text-preset-5">{rate.pair}</span>
        <span className="text-preset-6 text-neutral-50 sm:text-preset-5-medium">{rate.rate}</span>
        <RateChange
          className="text-preset-6 sm:text-preset-5 [&>span:first-child]:w-075 [&>span:first-child]:text-[6.5px] sm:[&>span:first-child]:w-100 sm:[&>span:first-child]:text-[8.5px]"
          direction={rate.direction}
          value={rate.change}
        />
      </button>
    </li>
  );
}
