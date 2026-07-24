// @vitest-environment jsdom

import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { mockLiveRates } from "../testing/mock-live-rates";
import { LiveRateList } from "./live-rate-list";

const MARKET_SNAPSHOT_PAUSED_STORAGE_KEY = "fx-checker:market-snapshot-paused";
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function installMatchMedia(initialMatches = false) {
  let matches = initialMatches;
  const listeners = new Set<(event: MediaQueryListEvent) => void>();
  const mediaQuery = {
    addEventListener: (type: string, listener: (event: MediaQueryListEvent) => void) => {
      if (type === "change") {
        listeners.add(listener);
      }
    },
    dispatchEvent: () => true,
    get matches() {
      return matches;
    },
    media: REDUCED_MOTION_QUERY,
    onchange: null,
    removeEventListener: (type: string, listener: (event: MediaQueryListEvent) => void) => {
      if (type === "change") {
        listeners.delete(listener);
      }
    },
  } as unknown as MediaQueryList;

  vi.stubGlobal(
    "matchMedia",
    vi.fn((query: string) => {
      expect(query).toBe(REDUCED_MOTION_QUERY);
      return mediaQuery;
    })
  );

  return {
    setMatches(nextMatches: boolean) {
      matches = nextMatches;
      const event = { matches, media: REDUCED_MOTION_QUERY } as MediaQueryListEvent;

      listeners.forEach((listener) => {
        listener(event);
      });
    },
  };
}

beforeEach(() => {
  window.localStorage.clear();
  installMatchMedia();
  vi.spyOn(HTMLElement.prototype, "scrollWidth", "get").mockReturnValue(1300);
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  window.localStorage.clear();
});

function getRatesList() {
  return screen.getByRole("list", { name: "Exchange rates" });
}

function getRatesTrack() {
  const track = getRatesList().parentElement;

  if (!track) {
    throw new Error("Expected the exchange rate list to have a track");
  }

  return track;
}

describe("LiveRateList", () => {
  it("renders one accessible playback control for the market snapshot", async () => {
    render(<LiveRateList rates={mockLiveRates} />);

    const snapshot = screen.getByRole("complementary", { name: "Market snapshot" });
    const playbackControl = await screen.findByRole("button", { name: "Pause rates" });
    const ratesList = getRatesList();

    expect(snapshot.contains(playbackControl)).toBe(true);
    expect(snapshot.contains(ratesList)).toBe(true);
    expect(playbackControl.textContent).toBe("");
    expect(playbackControl.getAttribute("aria-controls")).toBe(ratesList.id);
    expect(playbackControl.hasAttribute("aria-pressed")).toBe(false);
    expect(playbackControl.querySelectorAll("svg")).toHaveLength(1);
    expect(within(playbackControl).queryByRole("img")).toBeNull();
  });

  it("renders every accessible rate in order", () => {
    render(<LiveRateList rates={mockLiveRates} />);

    const list = getRatesList();
    const items = within(list).getAllByRole("listitem");

    expect(items).toHaveLength(7);
    expect(items[0]?.getAttribute("aria-label")).toBe("EUR/USD, 1.1723, -0.14%");
    expect(items[0]?.textContent).toBe("EUR/USD1.1723-0.14%");
    expect(items[6]?.getAttribute("aria-label")).toBe("USD/CAD, 1.3815, +0.04%");
    expect(items[6]?.textContent).toBe("USD/CAD1.3815+0.04%");
  });

  it("exposes one rate list while rendering one hidden duplicate for the loop", () => {
    const { container } = render(<LiveRateList rates={mockLiveRates} />);

    expect(container.querySelectorAll("li")).toHaveLength(14);
    expect(screen.getAllByRole("list")).toHaveLength(1);
    expect(container.querySelector('ul[aria-hidden="true"]')).toBeTruthy();
  });

  it("clips the visual track without adding another keyboard interaction", () => {
    render(<LiveRateList rates={mockLiveRates} />);

    const viewport = getRatesTrack().parentElement;

    expect(viewport?.getAttribute("tabindex")).toBeNull();
    expect(viewport?.hasAttribute("data-live-rates-viewport")).toBe(true);
    expect(viewport?.classList.contains("overflow-x-clip")).toBe(true);
    expect(viewport?.classList.contains("overflow-x-auto")).toBe(false);
  });

  it("autoplays after measuring when reduced motion and a saved pause are absent", async () => {
    render(<LiveRateList rates={mockLiveRates} />);

    expect(await screen.findByRole("button", { name: "Pause rates" })).toBeTruthy();
    expect(getRatesTrack().getAttribute("data-playback-state")).toBe("playing");
    expect(getRatesTrack().getAttribute("data-interaction-paused")).toBe("false");
    expect(getRatesTrack().classList.contains("fx-live-rates-marquee")).toBe(true);
    expect(getRatesTrack().style.getPropertyValue("--fx-live-rates-duration")).toBe("50s");
  });

  it("pauses on mouse hover and resumes immediately after hover ends", async () => {
    render(<LiveRateList rates={mockLiveRates} />);

    await screen.findByRole("button", { name: "Pause rates" });
    const track = getRatesTrack();
    const viewport = track.parentElement;

    if (!viewport) {
      throw new Error("Expected the exchange rate track to have a viewport");
    }

    fireEvent.pointerEnter(viewport, { pointerType: "mouse" });
    expect(track.getAttribute("data-interaction-paused")).toBe("true");

    fireEvent.pointerLeave(viewport, { pointerType: "mouse", relatedTarget: document.body });
    expect(track.getAttribute("data-interaction-paused")).toBe("false");
  });

  it("keeps hover playback paused while the mouse moves between rate items", async () => {
    render(<LiveRateList rates={mockLiveRates} />);

    await screen.findByRole("button", { name: "Pause rates" });
    const track = getRatesTrack();
    const viewport = track.parentElement;
    const firstItem = within(getRatesList()).getAllByRole("listitem")[0];

    if (!viewport || !firstItem) {
      throw new Error("Expected the exchange rate viewport and its first item");
    }

    fireEvent.pointerEnter(viewport, { pointerType: "mouse" });
    fireEvent.pointerEnter(firstItem, { pointerType: "mouse" });
    fireEvent.pointerLeave(viewport, { pointerType: "mouse", relatedTarget: firstItem });

    expect(track.getAttribute("data-interaction-paused")).toBe("true");

    fireEvent.pointerLeave(viewport, { pointerType: "mouse", relatedTarget: document.body });
    expect(track.getAttribute("data-interaction-paused")).toBe("false");
  });

  it("does not pause playback when a touch pointer enters the rate rail", async () => {
    render(<LiveRateList rates={mockLiveRates} />);

    await screen.findByRole("button", { name: "Pause rates" });
    const track = getRatesTrack();
    const viewport = track.parentElement;

    if (!viewport) {
      throw new Error("Expected the exchange rate track to have a viewport");
    }

    fireEvent.pointerEnter(viewport, { pointerType: "touch" });

    expect(track.getAttribute("data-interaction-paused")).toBe("false");
  });

  it("starts paused when the visitor previously paused the rates", () => {
    window.localStorage.setItem(MARKET_SNAPSHOT_PAUSED_STORAGE_KEY, "1");

    render(<LiveRateList rates={mockLiveRates} />);

    expect(screen.getByRole("button", { name: "Play rates" })).toBeTruthy();
    expect(getRatesTrack().getAttribute("data-playback-state")).toBe("paused");
  });

  it("starts paused when reduced motion is requested", () => {
    installMatchMedia(true);

    render(<LiveRateList rates={mockLiveRates} />);

    expect(screen.getByRole("button", { name: "Play rates" })).toBeTruthy();
    expect(getRatesTrack().getAttribute("data-playback-state")).toBe("paused");
  });

  it("saves an explicit pause and clears it when playback resumes", async () => {
    render(<LiveRateList rates={mockLiveRates} />);

    fireEvent.click(await screen.findByRole("button", { name: "Pause rates" }));

    expect(screen.getByRole("button", { name: "Play rates" })).toBeTruthy();
    expect(window.localStorage.getItem(MARKET_SNAPSHOT_PAUSED_STORAGE_KEY)).toBe("1");

    fireEvent.click(screen.getByRole("button", { name: "Play rates" }));

    expect(screen.getByRole("button", { name: "Pause rates" })).toBeTruthy();
    expect(window.localStorage.getItem(MARKET_SNAPSHOT_PAUSED_STORAGE_KEY)).toBeNull();
  });

  it("responds to system motion preference changes without saving a manual pause", async () => {
    const motionPreference = installMatchMedia();
    render(<LiveRateList rates={mockLiveRates} />);

    await screen.findByRole("button", { name: "Pause rates" });

    act(() => {
      motionPreference.setMatches(true);
    });

    expect(screen.getByRole("button", { name: "Play rates" })).toBeTruthy();
    expect(getRatesTrack().getAttribute("data-playback-state")).toBe("paused");
    expect(window.localStorage.getItem(MARKET_SNAPSHOT_PAUSED_STORAGE_KEY)).toBeNull();

    act(() => {
      motionPreference.setMatches(false);
    });

    expect(screen.getByRole("button", { name: "Pause rates" })).toBeTruthy();
  });

  it("lets reduced-motion visitors play deliberately without persisting the override", () => {
    installMatchMedia(true);
    const firstRender = render(<LiveRateList rates={mockLiveRates} />);

    fireEvent.click(screen.getByRole("button", { name: "Play rates" }));

    expect(screen.getByRole("button", { name: "Pause rates" })).toBeTruthy();
    expect(window.localStorage.getItem(MARKET_SNAPSHOT_PAUSED_STORAGE_KEY)).toBeNull();

    firstRender.unmount();
    render(<LiveRateList rates={mockLiveRates} />);

    expect(screen.getByRole("button", { name: "Play rates" })).toBeTruthy();
  });

  it("fails safely to static playback when motion preferences are unavailable", () => {
    vi.stubGlobal("matchMedia", undefined);

    render(<LiveRateList rates={mockLiveRates} />);

    expect(screen.getByRole("button", { name: "Play rates" })).toBeTruthy();
    expect(getRatesTrack().getAttribute("data-playback-state")).toBe("paused");
  });

  it("does not expose ticker items as focusable actions", () => {
    render(<LiveRateList rates={mockLiveRates} />);

    const list = getRatesList();
    const firstItem = within(list).getAllByRole("listitem")[0];

    expect(firstItem?.getAttribute("tabindex")).toBeNull();
    expect(within(list).queryByRole("button")).toBeNull();
  });

  it("uses the direction to style positive and negative changes", () => {
    render(<LiveRateList rates={mockLiveRates.slice(0, 2)} />);

    const list = getRatesList();
    const items = within(list).getAllByRole("listitem");
    const negativeChange = items[0]?.querySelector("span:last-child");
    const positiveChange = items[1]?.querySelector("span:last-child");

    expect(negativeChange?.textContent).toBe("-0.14%");
    expect(negativeChange?.getAttribute("data-change-indicator")).toBe("▼\u00a0");
    expect(negativeChange?.className).toContain("before:content-[attr(data-change-indicator)]");
    expect(negativeChange?.classList.contains("text-red-500")).toBe(true);
    expect(positiveChange?.textContent).toBe("+0.04%");
    expect(positiveChange?.getAttribute("data-change-indicator")).toBe("▲\u00a0");
    expect(positiveChange?.className).toContain("before:content-[attr(data-change-indicator)]");
    expect(positiveChange?.classList.contains("text-green-500")).toBe(true);
  });

  it("uses muted text and no arrow for neutral changes", () => {
    render(
      <LiveRateList
        rates={[{ pair: "EUR/USD", rate: "1.1710", change: "0.00%", direction: "neutral" }]}
      />
    );

    const list = getRatesList();
    const item = within(list).getByRole("listitem");

    expect(item.getAttribute("aria-label")).toBe("EUR/USD, 1.1710, 0.00%");
    expect(item.textContent).toBe("EUR/USD1.17100.00%");
    expect(within(list).getByText("0.00%").classList.contains("text-neutral-200")).toBe(true);
  });
});
