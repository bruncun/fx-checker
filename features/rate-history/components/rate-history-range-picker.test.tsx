// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { RateHistoryRangePicker } from "./rate-history-range-picker";

const { routerReplace, testSearchParams } = vi.hoisted(() => ({
  routerReplace: vi.fn(),
  testSearchParams: { current: "" },
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
  useRouter: () => ({
    replace: routerReplace,
  }),
  useSearchParams: () => new URLSearchParams(testSearchParams.current),
}));

afterEach(() => {
  routerReplace.mockClear();
  testSearchParams.current = "";
  cleanup();
});

describe("RateHistoryRangePicker", () => {
  it("optimistically selects the clicked range while the route update is pending", () => {
    render(<RateHistoryRangePicker selectedRange="1M" />);

    fireEvent.click(screen.getByRole("tab", { name: "3M" }));

    expect(screen.getByRole("tab", { name: "3M" }).getAttribute("aria-selected")).toBe("true");
    expect(screen.getByRole("tab", { name: "1M" }).getAttribute("aria-selected")).toBe("false");
    expect(routerReplace).toHaveBeenCalledWith("/?range=3M", { scroll: false });
  });

  it("preserves existing URL state when selecting a new range", () => {
    testSearchParams.current = "from=GBP&to=JPY&range=1M";

    render(<RateHistoryRangePicker selectedRange="1M" />);

    fireEvent.click(screen.getByRole("tab", { name: "1Y" }));

    expect(routerReplace).toHaveBeenCalledWith("/?from=GBP&to=JPY&range=1Y", { scroll: false });
  });
});
