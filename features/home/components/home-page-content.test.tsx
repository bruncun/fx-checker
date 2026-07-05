// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { HomePageContent } from "./home-page-content";

afterEach(cleanup);

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
    expect(screen.getByText("56 Currencies")).toBeTruthy();
    expect(screen.getByRole("region", { name: "Converter" })).toBeTruthy();
    expect(screen.getByRole("region", { name: "Live exchange rates" })).toBeTruthy();
    expect(screen.getByRole("region", { name: "Rate details" })).toBeTruthy();
  });
});
