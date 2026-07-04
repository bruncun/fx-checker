import { TabButton } from "@/components/ui/tab-button";
import { cn } from "@/lib/utils";
import { rateDetailsSectionDefinitions } from "./rate-details-navigation-state";

type RateDetailsRowsFallbackProps = {
  label: string;
  rowCount?: number;
  variant: "compare" | "favorites" | "log";
};

function EmptyBox({ className }: { className: string }) {
  return <span aria-hidden className={cn("block", className)} />;
}

function RateDetailsRowFallback({ variant }: Pick<RateDetailsRowsFallbackProps, "variant">) {
  const gridClassName =
    variant === "compare"
      ? "grid-cols-[auto_minmax(0,1fr)_auto_auto]"
      : variant === "favorites"
        ? "grid-cols-[minmax(0,1fr)_auto_auto]"
        : "grid-cols-[minmax(0,1fr)_minmax(9ch,auto)_auto] grid-rows-[auto_auto] sm:grid-rows-none sm:grid-cols-[64px_minmax(0,1fr)_auto_auto] sm:gap-x-200 sm:py-200";

  return (
    <li
      className={cn(
        "grid w-full items-center gap-x-125 rounded-16 bg-neutral-600 px-150 py-150 shadow-[inset_0_0_0_1px_hsl(var(--neutral-500))] sm:gap-x-250 sm:px-200",
        gridClassName
      )}
    >
      {variant === "compare" ? (
        <>
          <EmptyBox className="size-300" />
          <EmptyBox className="h-[37px] min-w-0" />
          <EmptyBox className="h-[37px] min-w-[9ch]" />
          <EmptyBox className="size-400" />
        </>
      ) : variant === "favorites" ? (
        <>
          <EmptyBox className="h-[28px] min-w-0" />
          <EmptyBox className="h-[35px] min-w-[9ch]" />
          <EmptyBox className="size-400" />
        </>
      ) : (
        <>
          <EmptyBox className="col-start-1 row-start-1 h-250 w-500 sm:col-start-1 sm:row-start-auto" />
          <EmptyBox className="col-start-1 row-start-2 h-250 min-w-0 sm:col-start-2 sm:row-start-auto" />
          <EmptyBox className="col-start-2 row-span-2 row-start-1 h-[40px] min-w-[9ch] self-center sm:col-start-3 sm:row-span-1 sm:row-start-auto sm:h-300" />
          <EmptyBox className="col-start-3 row-span-2 row-start-1 size-400 justify-self-end sm:col-start-4 sm:row-span-1 sm:row-start-auto" />
        </>
      )}
    </li>
  );
}

function RateDetailsRowsFallback({ label, rowCount = 8, variant }: RateDetailsRowsFallbackProps) {
  const headingSlot =
    variant === "compare" ? (
      <>
        <span>Multi-Currency</span>
        <span className="inline-flex min-w-0 gap-125 text-preset-3-medium text-neutral-50">
          &nbsp;
        </span>
      </>
    ) : variant === "favorites" ? (
      <span className="block text-preset-3-medium text-neutral-50">Pinned Pairs</span>
    ) : (
      <span className="block text-preset-3-medium text-neutral-50">Conversion Log</span>
    );

  return (
    <section
      aria-label={label}
      className={cn(
        "rounded-20 bg-neutral-700 p-200 shadow-[inset_0_0_0_1px_hsl(var(--neutral-600))] sm:p-250",
        variant === "log" ? "py-250" : undefined
      )}
    >
      <header
        className={cn(
          "flex items-center justify-between gap-200 pb-200 uppercase sm:pb-250",
          variant === "compare" || variant === "log"
            ? "block sm:flex sm:items-center sm:justify-between"
            : undefined
        )}
      >
        <h2
          className={cn(
            "min-w-0",
            variant === "compare"
              ? "flex min-w-0 flex-wrap items-baseline gap-x-125 text-preset-4 text-neutral-200"
              : undefined
          )}
        >
          {headingSlot}
        </h2>
        <EmptyBox
          className={cn(
            "w-700 h-[14px] shrink-0 sm:h-[19px]",
            variant === "compare" ? "mt-125 sm:mt-0" : undefined,
            variant === "log" ? "mt-[10px] h-[34px] sm:mt-0 sm:h-[30px]" : undefined
          )}
        />
      </header>
      <ul className="flex flex-col gap-150">
        {Array.from({ length: rowCount }, (_, index) => (
          <RateDetailsRowFallback key={index} variant={variant} />
        ))}
      </ul>
    </section>
  );
}

function RateHistoryFallback() {
  return (
    <section aria-label="Rate history" className="uppercase">
      <div className="lg:flex lg:items-center lg:justify-between lg:gap-400">
        <div className="grid grid-cols-2 gap-125 sm:inline-grid sm:grid-cols-4 sm:gap-200">
          {["Open", "Last", "Change", "% Change"].map((label) => (
            <article
              className="rounded-16 bg-neutral-700 px-250 py-150 shadow-[inset_0_0_0_1px_hsl(var(--neutral-600))] sm:min-w-[140px]"
              key={label}
            >
              <p className="text-preset-4 text-neutral-50/70">{label}</p>
              <EmptyBox className="mt-200 h-300" />
            </article>
          ))}
        </div>
        <div className="mt-250 flex min-h-[42px] gap-100 sm:min-h-[46px] lg:mt-0" />
      </div>
      <div className="mt-200 min-h-[369px] rounded-16 bg-neutral-700 p-200 shadow-[inset_0_0_0_1px_hsl(var(--neutral-600))] sm:mt-250" />
    </section>
  );
}

function RateDetailsNavigationFallback() {
  return (
    <nav aria-label="Rate details sections" className="relative w-full">
      <div aria-hidden className="h-500 w-full sm:hidden" />
      <div
        className="hidden w-full items-start gap-250 shadow-[inset_0_-1px_0_0_hsl(var(--neutral-600))] sm:flex sm:gap-100"
        aria-label="Rate details sections"
        role="tablist"
      >
        {rateDetailsSectionDefinitions.map((item) => (
          <TabButton
            key={item.value}
            active={false}
            aria-label={item.label}
            href={item.href}
            label={item.label}
            reserveCount={item.value === "favorites" || item.value === "log"}
            scroll={false}
            tabIndex={-1}
          />
        ))}
      </div>
    </nav>
  );
}

export { RateDetailsNavigationFallback, RateDetailsRowsFallback, RateHistoryFallback };
