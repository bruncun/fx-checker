// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { RateDetailsList } from "./rate-details-list-shell";

afterEach(() => {
  cleanup();
});

describe("RateDetailsList", () => {
  it("lets custom header layout classes override the default layout", () => {
    render(
      <RateDetailsList
        countSlot={<p>7 Logged</p>}
        headerClassName="block pb-250 sm:flex sm:items-center sm:justify-between"
        headingId="conversion-log-heading"
        headingSlot={<span>Conversion Log</span>}
      >
        <div>Rows</div>
      </RateDetailsList>
    );

    const header = screen.getByRole("heading", { name: "Conversion Log" }).closest("header");

    expect(header?.className).toContain("block");
    expect(header?.className).toContain("sm:flex");
    expect(header?.className.split(/\s+/)).not.toContain("flex");
  });
});
