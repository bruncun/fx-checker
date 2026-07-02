"use client";

import * as React from "react";

import { InlineMetaList } from "@/components/ui/inline-meta-list";
import { RangePicker, type RangePickerOption } from "@/components/ui/range-picker";
import { RateChange } from "@/components/ui/rate-change";
import { TabEmptyState } from "@/components/ui/tab-empty-state";
import {
  getRateHistoryRangePoints,
  getRateHistoryStats,
  historyRanges,
  type HistoryRange,
  type RateHistoryData,
  type RateHistoryPoint,
} from "@/features/rate-history/rate-history";
import { scaleLinear, scaleUtc } from "d3-scale";
import { area, line } from "d3-shape";

const ranges: RangePickerOption[] = historyRanges.map((range) => ({
  label: range,
  value: range,
}));

type ChartPoint = {
  date: Date;
  rate: number;
};

type RateHistoryXAxisLabel = {
  label: string;
  tabletOnly?: boolean;
  x: number;
};

const chartWidth = 267;
const chartHeight = 272;

const dateFormatter = new Intl.DateTimeFormat("en", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});

function formatRateAxisLabel(value: number) {
  return value.toFixed(4);
}

function formatDateAxisLabel(date: Date) {
  return dateFormatter.format(date);
}

function getDateAtProgress(startDate: Date, endDate: Date, progress: number) {
  return new Date(startDate.getTime() + (endDate.getTime() - startDate.getTime()) * progress);
}

function getRateExtent(points: ChartPoint[]) {
  const rates = points.map((point) => point.rate);
  const max = Math.max(...rates);
  const min = Math.min(...rates);

  if (max === min) {
    const padding = Math.max(max * 0.001, 0.0001);

    return {
      max: max + padding,
      min: Math.max(0, min - padding),
    };
  }

  return { max, min };
}

function getRateHistoryChartModel(points: ChartPoint[]) {
  const firstPoint = points[0];
  const lastPoint = points.at(-1);

  if (!firstPoint || !lastPoint) {
    return null;
  }

  const rateExtent = getRateExtent(points);
  const midRate = (rateExtent.max + rateExtent.min) / 2;
  const xScale = scaleUtc().domain([firstPoint.date, lastPoint.date]).range([0, chartWidth]);
  const yScale = scaleLinear().domain([rateExtent.min, rateExtent.max]).range([chartHeight, 0]);
  const xAxisLabels: RateHistoryXAxisLabel[] = [
    { label: formatDateAxisLabel(firstPoint.date), x: xScale(firstPoint.date) },
    {
      label: formatDateAxisLabel(getDateAtProgress(firstPoint.date, lastPoint.date, 0.25)),
      tabletOnly: true,
      x: chartWidth * 0.25,
    },
    {
      label: formatDateAxisLabel(getDateAtProgress(firstPoint.date, lastPoint.date, 0.5)),
      x: chartWidth * 0.5,
    },
    {
      label: formatDateAxisLabel(getDateAtProgress(firstPoint.date, lastPoint.date, 0.75)),
      tabletOnly: true,
      x: chartWidth * 0.75,
    },
    { label: formatDateAxisLabel(lastPoint.date), x: xScale(lastPoint.date) },
  ];
  const linePath =
    line<ChartPoint>()
      .x((point) => xScale(point.date))
      .y((point) => yScale(point.rate))(points) ?? "";
  const areaPath =
    area<ChartPoint>()
      .x((point) => xScale(point.date))
      .y0(chartHeight)
      .y1((point) => yScale(point.rate))(points) ?? "";

  return {
    areaPath,
    linePath,
    xAxisLabels,
    yAxisLabels: [
      { label: formatRateAxisLabel(rateExtent.max), y: yScale(rateExtent.max) },
      { label: formatRateAxisLabel(midRate), y: yScale(midRate) },
      { label: formatRateAxisLabel(rateExtent.min), y: yScale(rateExtent.min) },
    ],
  };
}

type RateHistoryChartProps = {
  pair: string;
  points: ChartPoint[];
  range: HistoryRange;
};

function RateHistoryChart({ pair, points, range }: RateHistoryChartProps) {
  const chart = getRateHistoryChartModel(points);
  const firstPoint = points[0];
  const lastPoint = points.at(-1);

  if (!chart || !firstPoint || !lastPoint) {
    return null;
  }

  return (
    <section
      aria-labelledby="rate-history-chart-heading"
      className="rounded-16 bg-neutral-700 px-150 py-200 shadow-[inset_0_0_0_1px_hsl(var(--neutral-600))] sm:p-250"
    >
      <div className="flex items-center justify-between gap-150 uppercase">
        <h2 id="rate-history-chart-heading" className="text-preset-3-medium text-neutral-50">
          {pair}
        </h2>
        <InlineMetaList
          aria-atomic="true"
          aria-label="Chart details"
          aria-live="polite"
          className="justify-end text-right text-preset-5 text-neutral-100"
          separatorClassName="text-neutral-200"
          items={[lastPoint.rate.toFixed(4), `${formatDateAxisLabel(lastPoint.date)} 16:00 CET`]}
        />
      </div>
      <div
        aria-describedby="rate-history-chart-summary"
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
                id="rate-history-area"
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
              fill="url(#rate-history-area)"
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
      <p id="rate-history-chart-summary" className="sr-only" aria-live="polite" aria-atomic="true">
        {range} {pair} moved from {firstPoint.rate.toFixed(4)} on{" "}
        {formatDateAxisLabel(firstPoint.date)} to {lastPoint.rate.toFixed(4)} on{" "}
        {formatDateAxisLabel(lastPoint.date)}. The highest displayed rate is{" "}
        {chart.yAxisLabels[0]?.label}, and the lowest displayed rate is{" "}
        {chart.yAxisLabels[2]?.label}.
      </p>
    </section>
  );
}

function toChartPoints(points: RateHistoryPoint[]): ChartPoint[] {
  return points.map((point) => ({
    date: new Date(`${point.date}T00:00:00.000Z`),
    rate: point.rate,
  }));
}

type RateHistoryProps = {
  history: RateHistoryData | null;
  pair: string;
};

function RateHistory({ history, pair }: RateHistoryProps) {
  const [selectedRange, setSelectedRange] = React.useState<HistoryRange>("1M");
  const selectedPoints = React.useMemo(
    () => (history ? getRateHistoryRangePoints(history.points, selectedRange) : []),
    [history, selectedRange]
  );
  const selectedRateHistory = React.useMemo(() => toChartPoints(selectedPoints), [selectedPoints]);
  const stats = React.useMemo(() => getRateHistoryStats(selectedPoints), [selectedPoints]);
  const hasRateHistoryData =
    Boolean(history?.points.length) &&
    selectedPoints.length > 0 &&
    selectedRateHistory.length > 0 &&
    stats.length > 0;

  if (!hasRateHistoryData) {
    return (
      <TabEmptyState
        title="No chart data available"
        lead={
          <>
            We couldn&apos;t load rate history for {pair} right now.
            <br />
            This usually clears up in a minute.
          </>
        }
      />
    );
  }

  return (
    <section aria-label="Rate history" className="uppercase">
      <div className="lg:flex lg:items-center lg:justify-between lg:gap-400">
        <div
          className="grid grid-cols-2 gap-125 sm:inline-grid sm:grid-cols-4 sm:gap-200"
          aria-live="polite"
          aria-atomic="true"
        >
          {stats.map((stat) => (
            <article
              className="rounded-16 bg-neutral-700 px-250 py-150 shadow-[inset_0_0_0_1px_hsl(var(--neutral-600))] sm:min-w-[140px]"
              key={stat.label}
            >
              <p className="text-preset-4 text-neutral-50/70">{stat.label}</p>
              {stat.direction ? (
                <RateChange
                  className="mt-200 text-preset-2 sm:mt-200"
                  direction={stat.direction}
                  showIndicator={stat.showIndicator ?? false}
                  value={stat.value}
                />
              ) : (
                <p className="mt-200 text-preset-2 text-neutral-50">{stat.value}</p>
              )}
            </article>
          ))}
        </div>
        <RangePicker
          aria-label="History range"
          className="mt-250 lg:mt-0 lg:shrink-0"
          onValueChange={(value) => {
            if (historyRanges.includes(value as HistoryRange)) {
              setSelectedRange(value as HistoryRange);
            }
          }}
          options={ranges}
          value={selectedRange}
        />
      </div>
      <div className="mt-200 sm:mt-250">
        <RateHistoryChart
          pair={history?.pair ?? pair}
          points={selectedRateHistory}
          range={selectedRange}
        />
      </div>
    </section>
  );
}

export { RateHistory };
