import { LiveRateItem, type LiveRate } from "./live-rate-item";
import { cx } from "@/lib/cx";

type LiveRateListProps = {
  rates: LiveRate[];
};

export function LiveRateList({ rates }: LiveRateListProps) {
  return (
    <div className="w-full overflow-x-clip">
      <aside aria-label="Market snapshot" className="relative flex w-full bg-neutral-700">
        <div
          className={cx(
            "flex shrink-0 items-center bg-lime-500 px-100 py-150 text-preset-6 text-neutral-900 uppercase",
            "sm:h-500 sm:px-200 sm:text-preset-5-medium"
          )}
        >
          <span id="market-snapshot-heading">Market snapshot</span>
        </div>
        <div
          aria-label="Exchange rates"
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
      </aside>
    </div>
  );
}
