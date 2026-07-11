// @vitest-environment jsdom

import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { GUEST_ALERT_DISMISSED_COOKIE } from "@/features/guest-session/model/guest-session";
import { DismissibleGuestModeAlert } from "./guest-mode-alert-client";
import { HomePageContent } from "./home-page-content";
import { StaleExchangeRatesAlert } from "./stale-exchange-rates-alert";

const { guestModeAlert } = vi.hoisted(() => ({
  guestModeAlert: vi.fn(() => null),
}));

vi.mock("./guest-mode-alert", () => ({
  GuestModeAlert: guestModeAlert,
}));

beforeEach(() => {
  guestModeAlert.mockClear();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  document.cookie = `${GUEST_ALERT_DISMISSED_COOKIE}=; Path=/; Max-Age=0`;
});

describe("HomePageContent", () => {
  it("renders the immediate shell and slots", () => {
    render(
      <HomePageContent
        converterSlot={<section aria-label="Converter" />}
        headerStatsSlot={<span>56 Currencies</span>}
        liveRatesSlot={<section aria-label="Live exchange rates" />}
        rateDetailsSlot={<section aria-label="Rate details" />}
      />
    );

    expect(screen.getByRole("banner")).toBeTruthy();
    expect(screen.getByRole("img", { name: "FX Checker" })).toBeTruthy();
    expect(screen.getByRole("main")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Go to main content" }).getAttribute("href")).toBe(
      "#converter"
    );
    expect(screen.getByText("56 Currencies")).toBeTruthy();
    expect(screen.getByRole("region", { name: "Converter" })).toBeTruthy();
    expect(screen.getByRole("region", { name: "Live exchange rates" })).toBeTruthy();
    expect(screen.getByRole("region", { name: "Rate details" })).toBeTruthy();
  });

  it("renders the guest alert slot inside the shell", () => {
    render(
      <HomePageContent
        converterSlot={<section aria-label="Converter" />}
        headerStatsSlot={<span>56 Currencies</span>}
        liveRatesSlot={<section aria-label="Live exchange rates" />}
        rateDetailsSlot={<section aria-label="Rate details" />}
      />
    );

    expect(guestModeAlert).toHaveBeenCalled();
  });
});

describe("StaleExchangeRatesAlert", () => {
  it("shows the last successful refresh date", () => {
    render(<StaleExchangeRatesAlert fetchedAt="2026-07-08T09:00:00.000Z" />);

    expect(screen.getByRole("alert").textContent).toContain("Exchange rates could not be updated");
    expect(screen.getByRole("alert").textContent).toContain(
      "You're viewing data last refreshed on July 8, 2026."
    );
  });
});

describe("DismissibleGuestModeAlert", () => {
  it("renders a dismissible alert and stores dismissal in a session cookie", () => {
    vi.useFakeTimers();
    render(<DismissibleGuestModeAlert />);

    expect(screen.getByRole("alert").textContent).toContain(
      "Your data will not be stored to an account in guest mode"
    );

    fireEvent.click(screen.getByRole("button", { name: "Dismiss guest mode alert" }));

    expect(screen.getByRole("alert").className).toContain("fx-list-row-out");
    expect(
      screen.getByRole("button", { name: "Dismiss guest mode alert" }).getAttribute("disabled")
    ).toBe("");
    expect(document.cookie).toContain(`${GUEST_ALERT_DISMISSED_COOKIE}=1`);

    act(() => {
      vi.advanceTimersByTime(160);
    });

    expect(screen.queryByRole("alert")).toBeNull();
  });
});
