"use client";

import * as React from "react";

import { InlineMetaList } from "@/components/ui/inline-meta-list";
import { RangePicker, type RangePickerOption } from "@/components/ui/range-picker";
import { RateChange } from "@/components/ui/rate-change";
import { scaleLinear, scaleUtc } from "d3-scale";
import { area, line } from "d3-shape";

type HistoryRange = "1D" | "1W" | "1M" | "3M" | "1Y" | "5Y";

const ranges: RangePickerOption[] = ["1D", "1W", "1M", "3M", "1Y", "5Y"].map((range) => ({
  label: range,
  value: range,
}));

type RateHistoryPoint = {
  date: Date;
  rate: number;
};

type RateHistoryXAxisLabel = {
  label: string;
  tabletOnly?: boolean;
  x: number;
};

type RateHistoryStat = {
  direction?: "up" | "down";
  label: string;
  showIndicator?: boolean;
  value: string;
};

const chartWidth = 267;
const chartHeight = 272;

function createMockRateHistory(points: [string, number][]): RateHistoryPoint[] {
  return points.map(([date, rate]) => ({
    date: new Date(`${date}T00:00:00.000Z`),
    rate,
  }));
}

const mockRateHistoryByRange: Record<HistoryRange, RateHistoryPoint[]> = {
  "1D": createMockRateHistory([
    ["2026-05-13", 0.8538],
    ["2026-05-14", 0.8546],
  ]),
  "1W": createMockRateHistory([
    ["2026-05-08", 0.8536],
    ["2026-05-09", 0.8582],
    ["2026-05-10", 0.861],
    ["2026-05-11", 0.8585],
    ["2026-05-12", 0.8597],
    ["2026-05-13", 0.854],
    ["2026-05-14", 0.8598],
  ]),
  "1M": createMockRateHistory([
    ["2026-04-14", 0.8549],
    ["2026-04-15", 0.8578],
    ["2026-04-16", 0.8527],
    ["2026-04-17", 0.8504],
    ["2026-04-18", 0.8517],
    ["2026-04-19", 0.8561],
    ["2026-04-20", 0.8522],
    ["2026-04-21", 0.8494],
    ["2026-04-22", 0.8482],
    ["2026-04-23", 0.8461],
    ["2026-04-24", 0.8483],
    ["2026-04-25", 0.8446],
    ["2026-04-26", 0.8479],
    ["2026-04-27", 0.8509],
    ["2026-04-28", 0.8455],
    ["2026-04-29", 0.8468],
    ["2026-04-30", 0.8421],
    ["2026-05-01", 0.8452],
    ["2026-05-02", 0.8484],
    ["2026-05-03", 0.854],
    ["2026-05-04", 0.8576],
    ["2026-05-05", 0.8612],
    ["2026-05-06", 0.853],
    ["2026-05-07", 0.8486],
    ["2026-05-08", 0.8536],
    ["2026-05-09", 0.8582],
    ["2026-05-10", 0.861],
    ["2026-05-11", 0.8585],
    ["2026-05-12", 0.8597],
    ["2026-05-13", 0.854],
    ["2026-05-14", 0.8598],
  ]),
  "3M": createMockRateHistory([
    ["2026-02-14", 0.8642],
    ["2026-02-28", 0.8584],
    ["2026-03-14", 0.8618],
    ["2026-03-28", 0.8525],
    ["2026-04-11", 0.8493],
    ["2026-04-25", 0.8446],
    ["2026-05-09", 0.8582],
    ["2026-05-14", 0.8598],
  ]),
  "1Y": createMockRateHistory([
    ["2025-05-14", 0.9194],
    ["2025-07-14", 0.9078],
    ["2025-09-14", 0.8893],
    ["2025-11-14", 0.8732],
    ["2026-01-14", 0.8658],
    ["2026-03-14", 0.8618],
    ["2026-05-14", 0.8598],
  ]),
  "5Y": createMockRateHistory([
    ["2021-05-14", 0.8231],
    ["2022-05-14", 0.9576],
    ["2023-05-14", 0.9225],
    ["2024-05-14", 0.9191],
    ["2025-05-14", 0.9194],
    ["2026-05-14", 0.8598],
  ]),
};

const dateFormatter = new Intl.DateTimeFormat("en", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});

function formatRateAxisLabel(value: number) {
  return value.toFixed(4);
}

function formatSignedRateChange(value: number) {
  return `${value >= 0 ? "+" : ""}${value.toFixed(4)}`;
}

function formatSignedPercentChange(value: number) {
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
}

function formatDateAxisLabel(date: Date) {
  return dateFormatter.format(date);
}

function getRateHistoryStats(points: RateHistoryPoint[]): RateHistoryStat[] {
  const firstPoint = points[0];
  const lastPoint = points.at(-1);

  if (!firstPoint || !lastPoint) {
    return [];
  }

  const change = lastPoint.rate - firstPoint.rate;
  const percentChange = (change / firstPoint.rate) * 100;
  const direction = change >= 0 ? "up" : "down";

  return [
    { label: "Open", value: firstPoint.rate.toFixed(4) },
    { label: "Last", value: lastPoint.rate.toFixed(4) },
    { direction, label: "Change", showIndicator: false, value: formatSignedRateChange(change) },
    {
      direction,
      label: "% Change",
      showIndicator: true,
      value: formatSignedPercentChange(percentChange),
    },
  ];
}

function getDateAtProgress(startDate: Date, endDate: Date, progress: number) {
  return new Date(startDate.getTime() + (endDate.getTime() - startDate.getTime()) * progress);
}

function getRateExtent(points: RateHistoryPoint[]) {
  const rates = points.map((point) => point.rate);

  return {
    max: Math.max(...rates),
    min: Math.min(...rates),
  };
}

function getRateHistoryChartModel(points: RateHistoryPoint[]) {
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
    line<RateHistoryPoint>()
      .x((point) => xScale(point.date))
      .y((point) => yScale(point.rate))(points) ?? "";
  const areaPath =
    area<RateHistoryPoint>()
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
  points: RateHistoryPoint[];
  range: HistoryRange;
};

function RateHistoryChart({ points, range }: RateHistoryChartProps) {
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
          USD/EUR
        </h2>
        <InlineMetaList
          aria-label="Chart details"
          className="justify-end text-right text-preset-5 text-neutral-100"
          separatorClassName="text-neutral-200"
          items={[lastPoint.rate.toFixed(4), `${formatDateAxisLabel(lastPoint.date)} 16:00 CET`]}
        />
      </div>
      <div
        aria-describedby="rate-history-chart-summary"
        aria-label={`Mock ${range} USD to EUR rate history chart`}
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
      <p id="rate-history-chart-summary" className="sr-only">
        USD to EUR moved from {firstPoint.rate.toFixed(4)} on {formatDateAxisLabel(firstPoint.date)}{" "}
        to {lastPoint.rate.toFixed(4)} on {formatDateAxisLabel(lastPoint.date)}. The highest mock
        rate is {chart.yAxisLabels[0]?.label}, and the lowest mock rate is{" "}
        {chart.yAxisLabels[2]?.label}.
      </p>
    </section>
  );
}

function RateHistory() {
  const [selectedRange, setSelectedRange] = React.useState<HistoryRange>("1M");
  const selectedRateHistory = mockRateHistoryByRange[selectedRange];
  const stats = getRateHistoryStats(selectedRateHistory);

  return (
    <section aria-label="Rate history" className="uppercase">
      <div className="mt-200 sm:mt-250 lg:flex lg:items-center lg:justify-between lg:gap-400">
        <div className="grid grid-cols-2 gap-125 sm:inline-grid sm:grid-cols-4 sm:gap-200">
          {stats.map((stat) => (
            <article
              className="rounded-16 bg-neutral-700 px-250 py-150 shadow-[inset_0_0_0_1px_hsl(var(--neutral-600))] sm:w-[140px]"
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
            if (value in mockRateHistoryByRange) {
              setSelectedRange(value as HistoryRange);
            }
          }}
          options={ranges}
          value={selectedRange}
        />
      </div>
      <div className="mt-200 sm:mt-250">
        <RateHistoryChart points={selectedRateHistory} range={selectedRange} />
      </div>
    </section>
  );
}

export { RateHistory };
