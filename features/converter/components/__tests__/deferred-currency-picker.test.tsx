// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { DeferredCurrencyPicker } from "../deferred-currency-picker";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("DeferredCurrencyPicker", () => {
  it("opens and handles keyboard input before the prepared data resolves", async () => {
    let resolveResponse!: (response: { json: () => Promise<unknown>; ok: boolean }) => void;
    const fetchCurrencies = vi.fn(
      () =>
        new Promise<{ json: () => Promise<unknown>; ok: boolean }>((resolve) => {
          resolveResponse = resolve;
        })
    );
    const onCurrencySelect = vi.fn();
    vi.stubGlobal("fetch", fetchCurrencies);

    render(
      <DeferredCurrencyPicker
        countryCode="us"
        currencyCode="USD"
        onCurrencySelect={onCurrencySelect}
      />
    );

    const trigger = screen.getByRole("button", { name: "USD" });

    expect(fetchCurrencies).not.toHaveBeenCalled();

    fireEvent.pointerEnter(trigger);

    expect(fetchCurrencies).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("dialog", { name: "Currency picker" })).toBeNull();

    fireEvent.click(trigger);

    expect(screen.getByRole("dialog", { name: "Currency picker" })).toBeTruthy();
    expect(document.activeElement).toBe(
      screen.getByRole("searchbox", { name: "Search currencies" })
    );

    fireEvent.change(document.activeElement!, { target: { value: "jpy" } });
    fireEvent.keyDown(document.activeElement!, { key: "Enter" });

    resolveResponse({
      json: async () => ({
        availableCurrencies: [{ code: "JPY", countryCode: "jp", name: "Japanese Yen" }],
      }),
      ok: true,
    });

    await waitFor(() => {
      expect(onCurrencySelect).toHaveBeenCalledWith({
        code: "JPY",
        countryCode: "jp",
        name: "Japanese Yen",
      });
    });
    expect(screen.queryByRole("dialog", { name: "Currency picker" })).toBeNull();
  });
});
