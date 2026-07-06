import { scaleLinear, scaleUtc } from "d3-scale";
import { area, line } from "d3-shape";

import {
  getRateHistoryRangePoints,
  getRateHistoryStats,
  historyRanges,
  type RateHistoryChartModel,
  type RateHistoryData,
  type RateHistoryPoint,
  type RateHistoryRangeModel,
  type RateHistoryViewModel,
} from "@/features/rate-history/rate-history";

type ChartPoint = {
  date: Date;
  rate: number;
};

const chartWidth = 267;
const chartHeight = 272;

const dateFormatter = new Intl.DateTimeFormat("en", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});

const hoverDateFormatter = new Intl.DateTimeFormat("en", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
  year: "numeric",
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

function toChartPoints(points: RateHistoryPoint[]): ChartPoint[] {
  return points.map((point) => ({
    date: new Date(`${point.date}T00:00:00.000Z`),
    rate: point.rate,
  }));
}

function getRateHistoryChartModel(points: RateHistoryPoint[]): RateHistoryChartModel | null {
  const chartPoints = toChartPoints(points);
  const firstPoint = chartPoints[0];
  const lastPoint = chartPoints.at(-1);

  if (!firstPoint || !lastPoint) {
    return null;
  }

  const rateExtent = getRateExtent(chartPoints);
  const midRate = (rateExtent.max + rateExtent.min) / 2;
  const xScale = scaleUtc().domain([firstPoint.date, lastPoint.date]).range([0, chartWidth]);
  const yScale = scaleLinear().domain([rateExtent.min, rateExtent.max]).range([chartHeight, 0]);
  const linePath =
    line<ChartPoint>()
      .x((point) => xScale(point.date))
      .y((point) => yScale(point.rate))(chartPoints) ?? "";
  const areaPath =
    area<ChartPoint>()
      .x((point) => xScale(point.date))
      .y0(chartHeight)
      .y1((point) => yScale(point.rate))(chartPoints) ?? "";

  return {
    areaPath,
    firstDateLabel: formatDateAxisLabel(firstPoint.date),
    firstRate: firstPoint.rate.toFixed(4),
    lastDateLabel: formatDateAxisLabel(lastPoint.date),
    lastRate: lastPoint.rate.toFixed(4),
    linePath,
    points: chartPoints.map((point) => ({
      dateLabel: hoverDateFormatter.format(point.date),
      rateLabel: point.rate.toFixed(4),
      x: xScale(point.date),
      y: yScale(point.rate),
    })),
    xAxisLabels: [
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
    ],
    yAxisLabels: [
      { label: formatRateAxisLabel(rateExtent.max), y: yScale(rateExtent.max) },
      { label: formatRateAxisLabel(midRate), y: yScale(midRate) },
      { label: formatRateAxisLabel(rateExtent.min), y: yScale(rateExtent.min) },
    ],
  };
}

export function deriveRateHistoryViewModel(
  history: RateHistoryData | null
): RateHistoryViewModel | null {
  if (!history?.points.length) {
    return null;
  }

  const ranges: RateHistoryRangeModel[] = historyRanges.flatMap((range) => {
    const points = getRateHistoryRangePoints(history.points, range);
    const stats = getRateHistoryStats(points);
    const chart = getRateHistoryChartModel(points);

    if (points.length === 0 || stats.length === 0 || !chart) {
      return [];
    }

    return [{ chart, range, stats }];
  });

  return ranges.length > 0 ? { pair: history.pair, ranges } : null;
}
