import { InlineMetaList } from "@/components/ui/inline-meta-list";
import type { HistoryRange, RateHistoryChartModel } from "@/features/rate-history/rate-history";

const chartWidth = 267;

type RateHistoryChartProps = {
  chart: RateHistoryChartModel;
  pair: string;
  range: HistoryRange;
};

function RateHistoryChart({ chart, pair, range }: RateHistoryChartProps) {
  const chartId = `rate-history-chart-${range.toLowerCase()}`;
  const gradientId = `rate-history-area-${range.toLowerCase()}`;
  const summaryId = `rate-history-chart-summary-${range.toLowerCase()}`;
  const chartDetails = [chart.lastRate, `${chart.lastDateLabel} 16:00 CET`];

  return (
    <section
      aria-labelledby={chartId}
      className="rounded-16 bg-neutral-700 px-150 py-200 shadow-[inset_0_0_0_1px_hsl(var(--neutral-600))] sm:p-250"
    >
      <div className="flex h-[19px] items-center justify-between gap-150 uppercase">
        <h2 id={chartId} className="text-preset-3-medium text-neutral-50">
          {pair}
        </h2>
        <InlineMetaList
          aria-atomic="true"
          aria-label="Chart details"
          aria-live="polite"
          className="justify-end text-right text-preset-5 text-neutral-100"
          separatorClassName="text-neutral-200"
          items={chartDetails}
        />
      </div>
      <div
        aria-describedby={summaryId}
        aria-label={`${range} ${pair} rate history chart`}
        role="img"
        className="mt-250 grid grid-cols-[36px_1fr] gap-x-200"
      >
        <div className="relative h-[272px] text-preset-6 text-neutral-200">
          {chart.yAxisLabels.map((axisLabel, index) => (
            <span
              className="absolute left-0"
              key={`${axisLabel.label}-${axisLabel.y}-${index}`}
              style={{
                top: axisLabel.y,
                transform:
                  index === 0
                    ? "translateY(0)"
                    : index === chart.yAxisLabels.length - 1
                      ? "translateY(-100%)"
                      : "translateY(-50%)",
              }}
            >
              {axisLabel.label}
            </span>
          ))}
        </div>
        <div className="relative h-[272px] w-full overflow-hidden">
          <svg
            aria-hidden="true"
            className="absolute inset-0 h-[272px] w-full"
            fill="none"
            viewBox="0 0 267 272"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient
                id={gradientId}
                x1="0"
                x2="0"
                y1="0"
                y2="272"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="hsl(var(--lime-500))" />
                <stop offset="1" stopColor="hsl(var(--neutral-700))" stopOpacity="0" />
              </linearGradient>
            </defs>
            <g className="stroke-neutral-500" strokeDasharray="4 4">
              {chart.yAxisLabels.map((axisLabel, index) => (
                <line
                  key={`${axisLabel.label}-${axisLabel.y}-${index}`}
                  x1="0"
                  x2={chartWidth}
                  y1={axisLabel.y}
                  y2={axisLabel.y}
                  vectorEffect="non-scaling-stroke"
                />
              ))}
            </g>
            <path
              d={chart.areaPath}
              fill={`url(#${gradientId})`}
              vectorEffect="non-scaling-stroke"
            />
            <path
              d={chart.linePath}
              stroke="hsl(var(--lime-500))"
              strokeLinejoin="round"
              strokeWidth="2"
              fill="none"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
        </div>
        <div aria-hidden="true" />
        <div className="mt-200 flex justify-between text-preset-6 text-neutral-200">
          {chart.xAxisLabels.map((axisLabel, index) => (
            <span
              className={axisLabel.tabletOnly ? "hidden sm:inline" : undefined}
              key={`${axisLabel.label}-${axisLabel.x}-${index}`}
            >
              {axisLabel.label}
            </span>
          ))}
        </div>
      </div>
      <p id={summaryId} className="sr-only" aria-live="polite" aria-atomic="true">
        {range} {pair} moved from {chart.firstRate} on {chart.firstDateLabel} to {chart.lastRate} on{" "}
        {chart.lastDateLabel}. The highest displayed rate is {chart.yAxisLabels[0]?.label}, and the
        lowest displayed rate is {chart.yAxisLabels[2]?.label}.
      </p>
    </section>
  );
}

export { RateHistoryChart };
