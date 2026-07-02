import { LiveRateItem, type LiveRate } from "./live-rate-item";
import { cn } from "@/lib/utils";

type LiveRateListProps = {
  rates: LiveRate[];
};

export function LiveRateList({ rates }: LiveRateListProps) {
  return (
    <section className="relative flex w-full bg-neutral-700">
      <div
        className={cn(
          "flex shrink-0 items-center gap-100 bg-lime-500 px-100 py-150 text-preset-6 text-neutral-900 uppercase",
          "sm:h-500 sm:px-200 sm:text-preset-5-medium"
        )}
      >
        <span className="size-[6px] rounded-full bg-neutral-900" aria-hidden="true" />
        <span>Live markets</span>
      </div>
      <div
        className="min-w-0 flex-1 overflow-x-auto"
        role="region"
        aria-label="Live exchange rates"
      >
        <ul
          className="flex w-max divide-x divide-neutral-500 border-r border-neutral-500"
          aria-label="Live exchange rates"
        >
          {rates.map((rate) => (
            <LiveRateItem key={rate.pair} rate={rate} />
          ))}
        </ul>
      </div>
    </section>
  );
}
