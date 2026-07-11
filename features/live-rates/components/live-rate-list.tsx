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
        aria-label="Live exchange rates"
        className="min-w-0 flex-1 overflow-x-auto focus-visible:outline-none focus-visible:[&>ul]:relative focus-visible:[&>ul]:after:pointer-events-none focus-visible:[&>ul]:after:absolute focus-visible:[&>ul]:after:inset-0 focus-visible:[&>ul]:after:z-10 focus-visible:[&>ul]:after:shadow-[inset_0_0_0_1px_hsl(var(--lime-500))] focus-visible:[&>ul]:after:content-['']"
        data-live-rates-scroll-region
        role="region"
        tabIndex={0}
      >
        <ul className="flex w-max divide-x divide-neutral-500 border-r border-neutral-500">
          {rates.map((rate) => (
            <LiveRateItem key={rate.pair} rate={rate} />
          ))}
        </ul>
      </div>
    </section>
  );
}
