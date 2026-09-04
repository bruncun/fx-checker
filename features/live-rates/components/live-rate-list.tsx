"use client";

import * as React from "react";

import { Icon } from "@/components/ui/icon";
import { cx } from "@/lib/cx";
import { LiveRateItem, type LiveRate } from "./live-rate-item";

type LiveRateListProps = {
  rates: LiveRate[];
};

const MARKET_SNAPSHOT_PAUSED_STORAGE_KEY = "fx-checker:market-snapshot-paused";
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";
const MARQUEE_SPEED_PX_PER_SECOND = 26;
const MARQUEE_KEYFRAMES: Keyframe[] = [
  { transform: "translate3d(0, 0, 0)" },
  { transform: "translate3d(-50%, 0, 0)" },
];

function hasSavedPause() {
  try {
    return window.localStorage.getItem(MARKET_SNAPSHOT_PAUSED_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function savePausedPreference(isPaused: boolean) {
  try {
    if (isPaused) {
      window.localStorage.setItem(MARKET_SNAPSHOT_PAUSED_STORAGE_KEY, "1");
    } else {
      window.localStorage.removeItem(MARKET_SNAPSHOT_PAUSED_STORAGE_KEY);
    }
  } catch {
    // Keep the in-memory control operable when storage is unavailable.
  }
}

function setAnimationPlayback(animation: Animation, shouldPlay: boolean) {
  const currentTime = animation.currentTime;

  if (shouldPlay) {
    const timelineTime = animation.timeline?.currentTime;

    animation.play();

    if (currentTime !== null) {
      animation.currentTime = currentTime;
    }

    if (
      typeof currentTime === "number" &&
      typeof timelineTime === "number" &&
      animation.playbackRate !== 0
    ) {
      animation.startTime = timelineTime - currentTime / animation.playbackRate;
    }

    return;
  }

  animation.pause();

  if (currentTime !== null) {
    animation.currentTime = currentTime;
  }
}

export function LiveRateList({ rates }: LiveRateListProps) {
  const headingId = React.useId();
  const ratesListId = React.useId();
  const marqueeAnimationRef = React.useRef<{
    animation: Animation;
    durationMilliseconds: number;
  } | null>(null);
  const marqueeTrackRef = React.useRef<HTMLDivElement>(null);
  const primaryListRef = React.useRef<HTMLUListElement>(null);
  const [animationDurationSeconds, setAnimationDurationSeconds] = React.useState<number | null>(
    null
  );
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [isPlaybackReady, setIsPlaybackReady] = React.useState(false);
  const [isHoverPaused, setIsHoverPaused] = React.useState(false);

  React.useEffect(() => {
    function measureList() {
      const currentList = primaryListRef.current;

      if (!currentList) {
        return;
      }

      const listWidth = currentList.scrollWidth;

      setAnimationDurationSeconds(listWidth > 0 ? listWidth / MARQUEE_SPEED_PX_PER_SECOND : null);
    }

    let resizeObserver: ResizeObserver | undefined;
    const animationFrameId = requestAnimationFrame(() => {
      measureList();

      const listElement = primaryListRef.current;

      if (listElement && typeof ResizeObserver !== "undefined") {
        resizeObserver = new ResizeObserver(measureList);
        resizeObserver.observe(listElement);
      }
    });

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver?.disconnect();
    };
  }, [rates]);

  React.useEffect(() => {
    const marqueeTrack = marqueeTrackRef.current;

    if (!marqueeTrack || animationDurationSeconds === null) {
      return;
    }

    const durationMilliseconds = animationDurationSeconds * 1000;
    let marqueeAnimationState = marqueeAnimationRef.current;

    if (!marqueeAnimationState) {
      const animation = marqueeTrack.animate(MARQUEE_KEYFRAMES, {
        duration: durationMilliseconds,
        easing: "linear",
        iterations: Infinity,
      });

      marqueeAnimationState = { animation, durationMilliseconds };
      marqueeAnimationRef.current = marqueeAnimationState;
    } else if (marqueeAnimationState.durationMilliseconds !== durationMilliseconds) {
      const { animation, durationMilliseconds: previousDurationMilliseconds } =
        marqueeAnimationState;
      const previousCurrentTime = animation.currentTime;

      animation.effect?.updateTiming({ duration: durationMilliseconds });

      if (
        typeof previousCurrentTime === "number" &&
        previousDurationMilliseconds > 0 &&
        durationMilliseconds > 0
      ) {
        const completedIterations = Math.floor(previousCurrentTime / previousDurationMilliseconds);
        const iterationProgress =
          (previousCurrentTime % previousDurationMilliseconds) / previousDurationMilliseconds;

        animation.currentTime = (completedIterations + iterationProgress) * durationMilliseconds;
      }

      marqueeAnimationState.durationMilliseconds = durationMilliseconds;
    }

    const { animation: marqueeAnimation } = marqueeAnimationState;

    setAnimationPlayback(marqueeAnimation, isPlaying && !isHoverPaused);
  }, [animationDurationSeconds, isHoverPaused, isPlaying]);

  React.useEffect(
    () => () => {
      marqueeAnimationRef.current?.animation.cancel();
      marqueeAnimationRef.current = null;
    },
    []
  );

  React.useEffect(() => {
    if (animationDurationSeconds === null) {
      return;
    }

    if (typeof window.matchMedia !== "function") {
      setIsPlaybackReady(true);
      return;
    }

    const reducedMotion = window.matchMedia(REDUCED_MOTION_QUERY);
    const autoplayTimeout = window.setTimeout(() => {
      setIsPlaying(!reducedMotion.matches && !hasSavedPause());
      setIsPlaybackReady(true);
    });

    function handleReducedMotionChange(event: MediaQueryListEvent) {
      if (event.matches) {
        setIsPlaying(false);
      } else if (!hasSavedPause()) {
        setIsPlaying(true);
      }

      setIsPlaybackReady(true);
    }

    reducedMotion.addEventListener("change", handleReducedMotionChange);

    return () => {
      window.clearTimeout(autoplayTimeout);
      reducedMotion.removeEventListener("change", handleReducedMotionChange);
    };
  }, [animationDurationSeconds]);

  const playbackAction = isPlaybackReady ? (isPlaying ? "Pause" : "Play") : "Loading";

  function togglePlayback() {
    savePausedPreference(isPlaying);
    setIsPlaying((currentIsPlaying) => !currentIsPlaying);
  }

  function pauseForHover(event: React.PointerEvent<HTMLDivElement>) {
    if (event.pointerType === "touch") {
      return;
    }

    setIsHoverPaused(true);
  }

  function resumeAfterHover(event: React.PointerEvent<HTMLDivElement>) {
    if (event.relatedTarget instanceof Node && event.currentTarget.contains(event.relatedTarget)) {
      return;
    }

    setIsHoverPaused(false);
  }

  return (
    <div className="w-full overflow-x-clip">
      <aside aria-labelledby={headingId} className="relative flex w-full bg-neutral-700">
        <div
          className={cx(
            "flex shrink-0 items-center bg-lime-500 px-100 py-150 text-preset-6 text-neutral-900 uppercase",
            "sm:h-500 sm:px-200 sm:py-0 sm:text-preset-5-medium"
          )}
        >
          <span id={headingId}>Market snapshot</span>
        </div>
        <div className="flex w-[36px] shrink-0 items-center justify-center bg-neutral-700 sm:h-500">
          <button
            aria-controls={ratesListId}
            aria-label={`${playbackAction} rates`}
            aria-busy={!isPlaybackReady}
            className="group flex h-full w-full cursor-pointer items-center justify-center focus-visible:outline-none"
            disabled={!isPlaybackReady}
            onClick={togglePlayback}
            type="button"
          >
            <span
              aria-hidden="true"
              className="fx-market-control-surface fx-transition-surface relative flex size-300 items-center justify-center rounded-6 bg-neutral-500 text-neutral-50 shadow-[inset_0_0_0_1px_hsl(var(--neutral-400))] group-focus-visible:shadow-[inset_0_0_0_1px_hsl(var(--neutral-400)),0_0_0_3px_hsl(var(--neutral-700)),0_0_0_4px_hsl(var(--lime-500))]"
            >
              <span className="relative size-[10px] sm:size-[11px]">
                {isPlaybackReady ? (
                  <Icon
                    className="fx-market-control-icon absolute inset-0"
                    decorative
                    height="100%"
                    iconName={isPlaying ? "pause" : "play"}
                    width="100%"
                  />
                ) : null}
              </span>
            </span>
          </button>
        </div>
        <div
          className="min-w-0 flex-1 overflow-x-clip"
          data-live-rates-viewport
          onPointerEnter={pauseForHover}
          onPointerLeave={resumeAfterHover}
        >
          <div
            className={cx(
              "flex w-max",
              animationDurationSeconds !== null && "fx-live-rates-marquee"
            )}
            data-interaction-paused={isHoverPaused}
            data-playback-state={isPlaying ? "playing" : "paused"}
            ref={marqueeTrackRef}
          >
            <ul
              aria-label="Exchange rates"
              className="flex w-max divide-x divide-neutral-500 border-r border-neutral-500"
              id={ratesListId}
              ref={primaryListRef}
            >
              {rates.map((rate) => (
                <LiveRateItem key={rate.pair} rate={rate} />
              ))}
            </ul>
            {animationDurationSeconds !== null ? (
              <ul
                aria-hidden="true"
                className="flex w-max divide-x divide-neutral-500 border-r border-neutral-500"
              >
                {rates.map((rate) => (
                  <LiveRateItem key={`duplicate-${rate.pair}`} rate={rate} />
                ))}
              </ul>
            ) : null}
          </div>
        </div>
      </aside>
    </div>
  );
}
