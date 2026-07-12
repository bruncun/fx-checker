import { RateChange } from "@/components/ui/rate-change";

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
  return (
    <li className="flex items-center gap-125 p-150 uppercase sm:h-500 sm:px-[12.5px] sm:py-[13px]">
      <abbr className="text-preset-6 text-neutral-200 sm:text-preset-5">{rate.pair}</abbr>
      <span className="sr-only">, </span>
      <span className="text-preset-6 text-neutral-50 sm:text-preset-5-medium">{rate.rate}</span>
      <span className="sr-only">, </span>
      <RateChange
        className="text-preset-6 sm:text-preset-5 [&>span:first-child]:w-075 [&>span:first-child]:text-[6.5px] sm:[&>span:first-child]:w-100 sm:[&>span:first-child]:text-[8.5px]"
        direction={rate.direction}
        value={rate.change}
      />
    </li>
  );
}
