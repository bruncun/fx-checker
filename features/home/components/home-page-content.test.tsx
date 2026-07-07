// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { GUEST_ALERT_DISMISSED_COOKIE } from "@/features/guest-session/guest-session";
import { DismissibleGuestModeAlert } from "./guest-mode-alert-client";
import { HomePageContent } from "./home-page-content";

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

    expect(screen.getByAltText("FX Checker")).toBeTruthy();
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

describe("DismissibleGuestModeAlert", () => {
  it("renders a dismissible alert and stores dismissal in a session cookie", () => {
    render(<DismissibleGuestModeAlert />);

    expect(screen.getByRole("alert").textContent).toContain(
      "Your data will not be stored to an account in guest mode"
    );

    fireEvent.click(screen.getByRole("button", { name: "Dismiss" }));

    expect(screen.queryByRole("alert")).toBeNull();
    expect(document.cookie).toContain(`${GUEST_ALERT_DISMISSED_COOKIE}=1`);
  });
});
