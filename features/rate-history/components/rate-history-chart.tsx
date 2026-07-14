"use client";

import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";

import { InlineMetaList } from "@/components/ui/inline-meta-list";
import type {
  HistoryRange,
  RateHistoryChartModel,
  RateHistoryChartPoint,
} from "@/features/rate-history/model/rate-history";

const chartWidth = 267;
const chartHeight = 272;
const touchScrubIntentDelayMs = 120;

type RateHistoryChartProps = {
  chart: RateHistoryChartModel;
  pair: string;
  range: HistoryRange;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function getNearestPointIndex(points: RateHistoryChartPoint[], x: number) {
  return points.reduce<number | null>((nearestPointIndex, point, index) => {
    if (nearestPointIndex === null) {
      return index;
    }

    return Math.abs(point.x - x) < Math.abs(points[nearestPointIndex]!.x - x)
      ? index
      : nearestPointIndex;
  }, null);
}

function getKeyboardPageStep(pointCount: number) {
  return Math.max(1, Math.ceil(pointCount / 10));
}

type PendingTouchPointer = {
  clientX: number;
  element: HTMLDivElement;
  pointerId: number;
  timeoutId: number;
};

function RateHistoryChart({ chart, pair, range }: RateHistoryChartProps) {
  const chartId = `rate-history-chart-${range.toLowerCase()}`;
  const gradientId = `rate-history-area-${range.toLowerCase()}`;
  const keyboardHelpId = `rate-history-chart-keyboard-help-${range.toLowerCase()}`;
  const summaryId = `rate-history-chart-summary-${range.toLowerCase()}`;
  const activePointerId = useRef<number | null>(null);
  const isTouchScrubbingRef = useRef(false);
  const pendingTouchPointer = useRef<PendingTouchPointer | null>(null);
  const chartSurfaceRef = useRef<HTMLDivElement>(null);
  const [isTouchScrubbing, setIsTouchScrubbing] = useState(false);
  const [hoverPointIndex, setHoverPointIndex] = useState<number | null>(null);
  const [keyboardPointIndex, setKeyboardPointIndex] = useState<number | null>(null);
  const hoverPoint = hoverPointIndex === null ? null : (chart.points[hoverPointIndex] ?? null);
  const keyboardPoint =
    keyboardPointIndex === null ? null : (chart.points[keyboardPointIndex] ?? null);
  const activePoint = hoverPoint ?? keyboardPoint;
  const chartDetails = useMemo(
    () =>
      activePoint
        ? [activePoint.rateLabel, `${activePoint.dateLabel} 16:00 CET`]
        : [chart.lastRate, `${chart.lastDateLabel} 16:00 CET`],
    [activePoint, chart.lastDateLabel, chart.lastRate]
  );

  useEffect(() => {
    const chartSurface = chartSurfaceRef.current;

    function handleNativeTouchMove(event: globalThis.TouchEvent) {
      if (isTouchScrubbingRef.current) {
        event.preventDefault();
      }
    }

    chartSurface?.addEventListener("touchmove", handleNativeTouchMove, { passive: false });

    return () => {
      clearPendingTouchPointer();
      chartSurface?.removeEventListener("touchmove", handleNativeTouchMove);
    };
  }, []);

  function setTouchScrubbing(nextIsTouchScrubbing: boolean) {
    isTouchScrubbingRef.current = nextIsTouchScrubbing;
    setIsTouchScrubbing(nextIsTouchScrubbing);
  }

  function clearPendingTouchPointer() {
    if (pendingTouchPointer.current) {
      window.clearTimeout(pendingTouchPointer.current.timeoutId);
      pendingTouchPointer.current = null;
    }
  }

  function updateHoverPointFromClientX(element: HTMLDivElement, clientX: number) {
    const bounds = element.getBoundingClientRect();

    if (bounds.width === 0) {
      return;
    }

    const pointerX = clamp(((clientX - bounds.left) / bounds.width) * chartWidth, 0, chartWidth);

    setHoverPointIndex(getNearestPointIndex(chart.points, pointerX));
  }

  function updateHoverPointFromPointer(event: PointerEvent<HTMLDivElement>) {
    updateHoverPointFromClientX(event.currentTarget, event.clientX);
  }

  function capturePointer(element: HTMLDivElement, pointerId: number, touchScrubbing = false) {
    element.setPointerCapture(pointerId);
    activePointerId.current = pointerId;
    setTouchScrubbing(touchScrubbing);
  }

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    if (!event.isPrimary) {
      return;
    }

    clearPendingTouchPointer();

    if (event.pointerType === "touch") {
      const element = event.currentTarget;
      const { clientX, pointerId } = event;

      pendingTouchPointer.current = {
        clientX,
        element,
        pointerId,
        timeoutId: window.setTimeout(() => {
          const pendingPointer = pendingTouchPointer.current;

          if (pendingPointer?.pointerId !== pointerId || !element.isConnected) {
            return;
          }

          capturePointer(element, pointerId, true);
          updateHoverPointFromClientX(element, pendingPointer.clientX);
          pendingTouchPointer.current = null;
        }, touchScrubIntentDelayMs),
      };
      return;
    }

    capturePointer(event.currentTarget, event.pointerId);
    updateHoverPointFromPointer(event);
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    if (pendingTouchPointer.current?.pointerId === event.pointerId) {
      pendingTouchPointer.current.clientX = event.clientX;
    }

    if (event.pointerType === "touch" && activePointerId.current !== event.pointerId) {
      return;
    }

    if (activePointerId.current !== null && activePointerId.current !== event.pointerId) {
      return;
    }

    if (activePointerId.current === event.pointerId) {
      event.preventDefault();
    }

    updateHoverPointFromPointer(event);
  }

  function handlePointerUp(event: PointerEvent<HTMLDivElement>) {
    if (pendingTouchPointer.current?.pointerId === event.pointerId) {
      clearPendingTouchPointer();
      return;
    }

    if (activePointerId.current !== event.pointerId) {
      return;
    }

    activePointerId.current = null;
    setTouchScrubbing(false);

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    updateHoverPointFromPointer(event);
  }

  function handlePointerCancel(event: PointerEvent<HTMLDivElement>) {
    if (pendingTouchPointer.current?.pointerId === event.pointerId) {
      clearPendingTouchPointer();
      return;
    }

    if (activePointerId.current !== event.pointerId) {
      return;
    }

    activePointerId.current = null;
    setTouchScrubbing(false);
    setHoverPointIndex(null);
  }

  function handlePointerLeave() {
    if (activePointerId.current === null) {
      setHoverPointIndex(null);
    }
  }

  function moveKeyboardPoint(nextIndex: number) {
    setKeyboardPointIndex(clamp(nextIndex, 0, chart.points.length - 1));
  }

  function handleChartKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (chart.points.length === 0) {
      return;
    }

    const currentIndex = keyboardPointIndex ?? chart.points.length - 1;
    const pageStep = getKeyboardPageStep(chart.points.length);

    if (event.key === "ArrowLeft" || event.key === "ArrowDown") {
      event.preventDefault();
      moveKeyboardPoint(currentIndex - 1);
    } else if (event.key === "ArrowRight" || event.key === "ArrowUp") {
      event.preventDefault();
      moveKeyboardPoint(currentIndex + 1);
    } else if (event.key === "PageUp") {
      event.preventDefault();
      moveKeyboardPoint(currentIndex - pageStep);
    } else if (event.key === "PageDown") {
      event.preventDefault();
      moveKeyboardPoint(currentIndex + pageStep);
    } else if (event.key === "Home") {
      event.preventDefault();
      moveKeyboardPoint(0);
    } else if (event.key === "End") {
      event.preventDefault();
      moveKeyboardPoint(chart.points.length - 1);
    }
  }

  return (
    <section
      aria-label="Chart"
      className="rounded-16 bg-neutral-700 px-150 py-200 shadow-[inset_0_0_0_1px_hsl(var(--neutral-600))] sm:p-250"
    >
      <div className="flex h-[19px] items-center justify-between gap-150 uppercase">
        <h2 id={chartId} className="text-preset-3-medium text-neutral-50">
          {pair}
        </h2>
        <div aria-label="Chart details">
          <InlineMetaList
            aria-atomic="true"
            aria-live="polite"
            className="justify-end text-right text-preset-5 text-neutral-100"
            separatorClassName="text-neutral-200"
            items={chartDetails}
          />
        </div>
      </div>
      <div
        aria-describedby={`${summaryId} ${keyboardHelpId}`}
        onKeyDown={handleChartKeyDown}
        role="img"
        tabIndex={0}
        className="mt-250 grid grid-cols-[36px_1fr] gap-x-200 rounded-8 outline-none focus-visible:shadow-[0_0_0_2px_hsl(var(--neutral-700)),0_0_0_4px_hsl(var(--lime-500))]"
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
        <div
          ref={chartSurfaceRef}
          className={`relative h-[272px] w-full cursor-crosshair overflow-hidden select-none ${isTouchScrubbing ? "touch-none" : ""}`}
          onPointerCancel={handlePointerCancel}
          onPointerDown={handlePointerDown}
          onPointerLeave={handlePointerLeave}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        >
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
            {activePoint ? (
              <g className="pointer-events-none">
                <line
                  x1={activePoint.x}
                  x2={activePoint.x}
                  y1="0"
                  y2={chartHeight}
                  stroke="hsl(var(--neutral-200))"
                  strokeDasharray="4 4"
                  vectorEffect="non-scaling-stroke"
                />
                <line
                  x1="0"
                  x2={chartWidth}
                  y1={activePoint.y}
                  y2={activePoint.y}
                  stroke="hsl(var(--neutral-200))"
                  strokeDasharray="4 4"
                  vectorEffect="non-scaling-stroke"
                />
              </g>
            ) : null}
          </svg>
          {activePoint ? (
            <div
              aria-hidden="true"
              className="pointer-events-none absolute z-10 size-125 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-lime-500 bg-neutral-700 sm:size-150"
              style={{
                left: `${(activePoint.x / chartWidth) * 100}%`,
                top: `${(activePoint.y / chartHeight) * 100}%`,
              }}
            />
          ) : null}
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
      <figcaption id={summaryId} className="sr-only" aria-live="polite" aria-atomic="true">
        Over {range}, {pair} moved from {chart.firstRate} on {chart.firstDateLabel} to{" "}
        {chart.lastRate} on {chart.lastDateLabel}, with a high of {chart.yAxisLabels[0]?.label}, and
        a low of {chart.yAxisLabels[2]?.label}.
      </figcaption>
    </section>
  );
}

export { RateHistoryChart };
