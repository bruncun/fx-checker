// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { RangePicker, type RangePickerOption } from "./range-picker";

const options: RangePickerOption[] = ["1D", "1W", "1M", "3M"].map((range) => ({
  label: range,
  value: range,
}));

afterEach(() => {
  cleanup();
});

describe("RangePicker", () => {
  it("groups ranges as a tablist for switching history views", () => {
    render(<RangePicker aria-label="History range" options={options} value="1M" />);

    const group = screen.getByRole("tablist", { name: "History range" });
    const ranges = screen.getAllByRole("tab");

    expect(group).toBeTruthy();
    expect(ranges).toHaveLength(4);
    expect(screen.getByRole("tab", { name: "1M" }).getAttribute("aria-selected")).toBe("true");
    expect(screen.getByRole("tab", { name: "1M" }).getAttribute("tabindex")).toBe("0");
    expect(screen.getByRole("tab", { name: "1D" }).getAttribute("aria-selected")).toBe("false");
    expect(screen.getByRole("tab", { name: "1D" }).getAttribute("tabindex")).toBe("-1");
  });

  it("emits the selected range value", () => {
    const onValueChange = vi.fn();

    render(
      <RangePicker
        aria-label="History range"
        onValueChange={onValueChange}
        options={options}
        value="1M"
      />
    );

    fireEvent.click(screen.getByRole("tab", { name: "3M" }));

    expect(onValueChange).toHaveBeenCalledWith("3M");
  });

  it("activates the next range when focus moves with arrow keys", () => {
    const onValueChange = vi.fn();

    render(
      <RangePicker
        aria-label="History range"
        onValueChange={onValueChange}
        options={options}
        value="1M"
      />
    );

    const selectedRange = screen.getByRole("tab", { name: "1M" });

    selectedRange.focus();
    fireEvent.keyDown(selectedRange, { key: "ArrowRight" });

    expect(onValueChange).toHaveBeenCalledWith("3M");
    expect(document.activeElement).toBe(screen.getByRole("tab", { name: "3M" }));
  });

  it("keeps enabled ranges focusable and applies the lime focus ring style", () => {
    render(<RangePicker aria-label="History range" options={options} value="1M" />);

    const selectedRange = screen.getByRole("tab", { name: "1M" });

    expect(selectedRange).toHaveProperty("disabled", false);
    expect(selectedRange.classList.contains("disabled:opacity-50")).toBe(true);
    expect(
      selectedRange.classList.contains(
        "focus-visible:shadow-[0_0_0_3px_hsl(var(--neutral-700)),0_0_0_4px_hsl(var(--lime-500))]"
      )
    ).toBe(true);
  });

  it("disables every range option when the picker is disabled", () => {
    render(<RangePicker aria-label="History range" disabled options={options} value="1M" />);

    expect(screen.getAllByRole("tab").every((range) => range.hasAttribute("disabled"))).toBe(true);
  });
});
