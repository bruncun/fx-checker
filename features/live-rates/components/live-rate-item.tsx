import { cx } from "@/lib/cx";

export type LiveRate = {
  pair: string;
  rate: string;
  change: string;
  direction: "up" | "down" | "neutral";
};

type LiveRateItemProps = {
  rate: LiveRate;
};

export function LiveRateItem({ rate }: LiveRateItemProps) {
  const changeIndicator =
    rate.direction === "up" ? "▲\u00a0" : rate.direction === "down" ? "▼\u00a0" : undefined;

  return (
    <li
      aria-label={`${rate.pair}, ${rate.rate}, ${rate.change}`}
      className="flex items-center gap-125 p-150 uppercase sm:h-500 sm:px-[12.5px] sm:py-[13px]"
    >
      <abbr aria-hidden="true" className="text-preset-6 text-neutral-200 sm:text-preset-5">
        {rate.pair}
      </abbr>
      <span aria-hidden="true" className="text-preset-6 text-neutral-50 sm:text-preset-5-medium">
        {rate.rate}
      </span>
      <span
        aria-hidden="true"
        className={cx(
          "inline-flex items-center text-preset-6 sm:text-preset-5",
          rate.direction === "up" && "text-green-500",
          rate.direction === "down" && "text-red-500",
          rate.direction === "neutral" && "text-neutral-200",
          changeIndicator &&
            "before:inline-flex before:w-075 before:justify-center before:text-[6.5px] before:leading-none before:content-[attr(data-change-indicator)] sm:before:w-100 sm:before:text-[8.5px]"
        )}
        data-change-indicator={changeIndicator}
      >
        {rate.change}
      </span>
    </li>
  );
}
