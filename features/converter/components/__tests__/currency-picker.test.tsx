// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import * as React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { AvailableCurrency } from "../../model/currencies";
import { CurrencyPicker, getCurrencyGroups } from "../currency-picker";

const currencies: AvailableCurrency[] = [
  { code: "USD", countryCode: "us", name: "United States Dollar" },
  { code: "EUR", countryCode: "eu", name: "Euro" },
  { code: "JOD", countryCode: "jo", name: "Jordanian Dinar" },
  { code: "JPY", countryCode: "jp", name: "Japanese Yen" },
  { code: "TWD", countryCode: "tw", name: "New Taiwan Dollar" },
  { code: "ZAR", countryCode: "za", name: "South African Rand" },
];

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

function renderCurrencyPicker(onCurrencySelect = vi.fn(), currencyCode = "USD") {
  render(
    <CurrencyPicker
      countryCode="us"
      currencies={currencies}
      currencyCode={currencyCode}
      onCurrencySelect={onCurrencySelect}
    />
  );

  return {
    onCurrencySelect,
    trigger: screen.getByRole("button", { name: currencyCode }),
  };
}

describe("CurrencyPicker", () => {
  it("groups the supplied currencies and derives each group count", () => {
    const groups = getCurrencyGroups(currencies);
    const otherCurrencies = groups.find((group) => group.label === "Other currencies");

    expect(otherCurrencies?.currencies).toHaveLength(4);
    expect(otherCurrencies?.count).toBe(otherCurrencies?.currencies.length);
  });

  it("announces the selected currency code from the trigger", () => {
    const { trigger } = renderCurrencyPicker(vi.fn(), "EUR");

    expect(trigger.getAttribute("aria-label")).toBe("EUR");
    expect(screen.queryByRole("button", { name: "Select send currency" })).toBeNull();
  });

  it("opens the picker and moves focus to currency search", async () => {
    const { trigger } = renderCurrencyPicker();

    fireEvent.click(trigger);

    expect(screen.getByRole("dialog", { name: "Currency picker" })).toBeTruthy();
    await waitFor(() => {
      expect(document.activeElement).toBe(
        screen.getByRole("searchbox", { name: "Search currencies" })
      );
    });
    expect(
      screen.getByRole("searchbox", { name: "Search currencies" }).getAttribute("aria-controls")
    ).toBe(screen.getByLabelText("Currency results").id);
  });

  it("scrolls coarse-pointer triggers to the mobile picker position before focusing search", () => {
    const { trigger } = renderCurrencyPicker();
    const scrollTo = vi.fn();

    vi.stubGlobal(
      "matchMedia",
      vi.fn((query: string) => ({
        matches: query === "(pointer: coarse)",
      }))
    );
    vi.stubGlobal("scrollTo", scrollTo);
    Object.defineProperty(window, "scrollY", { configurable: true, value: 0 });
    vi.spyOn(trigger, "getBoundingClientRect").mockReturnValue({
      bottom: 280,
      height: 40,
      left: 0,
      right: 120,
      top: 240,
      width: 120,
      x: 0,
      y: 240,
      toJSON: () => ({}),
    });

    fireEvent.click(trigger);

    expect(scrollTo).toHaveBeenCalledWith({ behavior: "smooth", top: 188 });
    expect(document.activeElement).toBe(
      screen.getByRole("searchbox", { name: "Search currencies" })
    );
  });

  it("keeps mobile picker positioning instant when reduced motion is preferred", () => {
    const { trigger } = renderCurrencyPicker();
    const scrollTo = vi.fn();

    vi.stubGlobal(
      "matchMedia",
      vi.fn((query: string) => ({
        matches: query === "(pointer: coarse)" || query === "(prefers-reduced-motion: reduce)",
      }))
    );
    vi.stubGlobal("scrollTo", scrollTo);
    Object.defineProperty(window, "scrollY", { configurable: true, value: 0 });
    vi.spyOn(trigger, "getBoundingClientRect").mockReturnValue({
      bottom: 280,
      height: 40,
      left: 0,
      right: 120,
      top: 240,
      width: 120,
      x: 0,
      y: 240,
      toJSON: () => ({}),
    });

    fireEvent.click(trigger);

    expect(scrollTo).toHaveBeenCalledWith({ behavior: "auto", top: 188 });
  });

  it("does not reposition mobile triggers that are already at the picker position", () => {
    const { trigger } = renderCurrencyPicker();
    const scrollTo = vi.fn();

    vi.stubGlobal(
      "matchMedia",
      vi.fn((query: string) => ({
        matches: query === "(pointer: coarse)",
      }))
    );
    vi.stubGlobal("scrollTo", scrollTo);
    Object.defineProperty(window, "scrollY", { configurable: true, value: 188 });
    vi.spyOn(trigger, "getBoundingClientRect").mockReturnValue({
      bottom: 92,
      height: 40,
      left: 0,
      right: 120,
      top: 52,
      width: 120,
      x: 0,
      y: 52,
      toJSON: () => ({}),
    });

    fireEvent.click(trigger);

    expect(scrollTo).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(
      screen.getByRole("searchbox", { name: "Search currencies" })
    );
  });

  it("scrolls far enough to show the minimum usable mobile picker height", () => {
    const { trigger } = renderCurrencyPicker();
    const scrollTo = vi.fn();

    vi.stubGlobal(
      "matchMedia",
      vi.fn((query: string) => ({
        matches: query === "(pointer: coarse)",
      }))
    );
    vi.stubGlobal("scrollTo", scrollTo);
    Object.defineProperty(window, "innerHeight", { configurable: true, value: 200 });
    Object.defineProperty(window, "scrollY", { configurable: true, value: 0 });
    vi.spyOn(trigger, "getBoundingClientRect").mockReturnValue({
      bottom: 100,
      height: 40,
      left: 0,
      right: 120,
      top: 60,
      width: 120,
      x: 0,
      y: 60,
      toJSON: () => ({}),
    });

    fireEvent.click(trigger);

    expect(scrollTo).toHaveBeenCalledWith({ behavior: "smooth", top: 47 });
  });

  it("toggles closed when the trigger is clicked again", () => {
    const { trigger } = renderCurrencyPicker();

    fireEvent.click(trigger);
    fireEvent.click(trigger);

    expect(screen.queryByRole("dialog", { name: "Currency picker" })).toBeNull();
  });

  it("selects a currency, closes the picker, and restores focus", async () => {
    const onCurrencySelect = vi.fn();
    const { trigger } = renderCurrencyPicker(onCurrencySelect);

    fireEvent.click(trigger);
    fireEvent.click(screen.getByRole("button", { name: "EUR, Euro" }));

    expect(onCurrencySelect).toHaveBeenCalledWith({
      code: "EUR",
      countryCode: "eu",
      name: "Euro",
    });
    expect(screen.queryByRole("dialog", { name: "Currency picker" })).toBeNull();
    await waitFor(() => {
      expect(document.activeElement).toBe(trigger);
    });
  });

  it("closes on Escape and restores focus to the trigger", async () => {
    const { trigger } = renderCurrencyPicker();

    fireEvent.click(trigger);
    fireEvent.keyDown(screen.getByRole("dialog", { name: "Currency picker" }), { key: "Escape" });

    expect(screen.queryByRole("dialog", { name: "Currency picker" })).toBeNull();
    await waitFor(() => {
      expect(document.activeElement).toBe(trigger);
    });
  });

  it("closes on outside pointer interaction without restoring trigger focus", () => {
    const { trigger } = renderCurrencyPicker();

    fireEvent.click(trigger);
    fireEvent.pointerDown(document.body);

    expect(screen.queryByRole("dialog", { name: "Currency picker" })).toBeNull();
    expect(document.activeElement).not.toBe(trigger);
  });

  it("exposes the focus-trapped picker as a modal dialog", () => {
    const { trigger } = renderCurrencyPicker();

    fireEvent.click(trigger);

    expect(screen.getByRole("dialog", { name: "Currency picker" }).getAttribute("aria-modal")).toBe(
      "true"
    );
  });

  it("raises the open picker above adjacent currency controls", () => {
    const { trigger } = renderCurrencyPicker();

    expect(trigger.parentElement?.className).toContain("z-[70]");

    fireEvent.click(trigger);

    expect(trigger.parentElement?.className).toContain("z-[120]");
  });

  it("moves focus from search to the active currency with Tab or Shift+Tab", () => {
    const { trigger } = renderCurrencyPicker();

    fireEvent.click(trigger);
    const searchInput = screen.getByRole("searchbox", { name: "Search currencies" });
    const selectedCurrency = screen.getByRole("button", {
      name: "USD, United States Dollar",
    });
    searchInput.focus();

    fireEvent.keyDown(searchInput, { key: "Tab" });
    expect(document.activeElement).toBe(selectedCurrency);

    searchInput.focus();
    fireEvent.keyDown(searchInput, { key: "Tab", shiftKey: true });
    expect(document.activeElement).toBe(selectedCurrency);
  });

  it("continues keyboard navigation after the search input is focused with a pointer", () => {
    const { trigger } = renderCurrencyPicker();

    fireEvent.click(trigger);
    const searchInput = screen.getByRole("searchbox", { name: "Search currencies" });
    fireEvent.click(searchInput);
    searchInput.focus();

    fireEvent.keyDown(searchInput, { key: "Tab" });
    const selectedCurrency = screen.getByRole("button", {
      name: "USD, United States Dollar",
    });
    expect(document.activeElement).toBe(selectedCurrency);

    fireEvent.keyDown(selectedCurrency, { key: "ArrowDown" });
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "EUR, Euro" }));
  });

  it("moves focus from the selected currency to search on Shift+Tab", () => {
    const { trigger } = renderCurrencyPicker(vi.fn(), "EUR");

    fireEvent.click(trigger);
    const searchInput = screen.getByRole("searchbox", { name: "Search currencies" });
    const selectedCurrency = screen.getByRole("button", { name: "EUR, Euro" });

    fireEvent.keyDown(searchInput, { key: "Tab" });
    expect(document.activeElement).toBe(selectedCurrency);

    fireEvent.keyDown(selectedCurrency, { key: "Tab", shiftKey: true });

    expect(document.activeElement).toBe(searchInput);
  });

  it("moves focus from the active currency to search with Tab", () => {
    const { trigger } = renderCurrencyPicker();

    fireEvent.click(trigger);
    const activeCurrency = screen.getByRole("button", { name: "USD, United States Dollar" });
    activeCurrency.focus();

    fireEvent.keyDown(activeCurrency, { key: "Tab" });

    expect(document.activeElement).toBe(
      screen.getByRole("searchbox", { name: "Search currencies" })
    );
  });

  it("moves focus to search and seeds the query when typing from a currency", () => {
    const { trigger } = renderCurrencyPicker();

    fireEvent.click(trigger);
    const selectedCurrency = screen.getByRole("button", {
      name: "USD, United States Dollar",
    });
    const searchInput = screen.getByRole<HTMLInputElement>("searchbox", {
      name: "Search currencies",
    });

    selectedCurrency.focus();
    fireEvent.keyDown(selectedCurrency, { key: "j" });

    expect(document.activeElement).toBe(searchInput);
    expect(searchInput.value).toBe("j");
    expect(screen.getByRole("button", { name: "JPY, Japanese Yen" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "USD, US Dollar" })).toBeNull();
  });

  it("continues the existing search when typing from a filtered currency option", () => {
    const { trigger } = renderCurrencyPicker();

    fireEvent.click(trigger);
    const searchInput = screen.getByRole<HTMLInputElement>("searchbox", {
      name: "Search currencies",
    });
    searchInput.focus();
    fireEvent.change(searchInput, { target: { value: "j" } });

    const activeCurrency = screen.getByRole("button", { name: "JOD, Jordanian Dinar" });
    activeCurrency.focus();
    fireEvent.keyDown(activeCurrency, { key: "p" });

    expect(document.activeElement).toBe(searchInput);
    expect(searchInput.value).toBe("jp");
    expect(screen.getByRole("button", { name: "JPY, Japanese Yen" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "JOD, Jordanian Dinar" })).toBeNull();
  });

  it("filters currencies by code or name", () => {
    const { trigger } = renderCurrencyPicker();

    fireEvent.click(trigger);
    const searchInput = screen.getByRole("searchbox", { name: "Search currencies" });

    fireEvent.change(searchInput, { target: { value: "yen" } });
    expect(screen.getByRole("button", { name: "JPY, Japanese Yen" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "EUR, Euro" })).toBeNull();

    fireEvent.change(searchInput, { target: { value: "eur" } });
    expect(screen.getByRole("button", { name: "EUR, Euro" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "JPY, Japanese Yen" })).toBeNull();
  });

  it("shows the shortcut badge only while search is empty", () => {
    const { trigger } = renderCurrencyPicker();

    fireEvent.click(trigger);

    expect(screen.getByText(/K$/)).toBeTruthy();

    fireEvent.change(screen.getByRole("searchbox", { name: "Search currencies" }), {
      target: { value: "yen" },
    });

    expect(screen.queryByText(/K$/)).toBeNull();
  });

  it("only shows currency group headers before searching", () => {
    const { trigger } = renderCurrencyPicker();

    fireEvent.click(trigger);
    const searchInput = screen.getByRole("searchbox", { name: "Search currencies" });

    expect(screen.getByText("Popular")).toBeTruthy();
    expect(screen.getByText("Other currencies")).toBeTruthy();

    fireEvent.change(searchInput, { target: { value: "dollar" } });

    expect(screen.queryByText("Popular")).toBeNull();
    expect(screen.queryByText("Other currencies")).toBeNull();
    expect(screen.getByRole("button", { name: "USD, United States Dollar" })).toBeTruthy();
  });

  it("shows an empty state when no currencies match", () => {
    const { trigger } = renderCurrencyPicker();

    fireEvent.click(trigger);
    fireEvent.change(screen.getByRole("searchbox", { name: "Search currencies" }), {
      target: { value: "not-a-currency" },
    });

    expect(screen.getByRole("status").textContent).toBe("No currencies found.");
  });

  it("selects the only filtered result with Enter", () => {
    const onCurrencySelect = vi.fn();
    const { trigger } = renderCurrencyPicker(onCurrencySelect);

    fireEvent.click(trigger);
    const searchInput = screen.getByRole("searchbox", { name: "Search currencies" });
    searchInput.focus();
    fireEvent.change(searchInput, { target: { value: "Japanese Yen" } });
    fireEvent.keyDown(searchInput, { key: "Enter" });

    expect(onCurrencySelect).toHaveBeenCalledWith({
      code: "JPY",
      countryCode: "jp",
      name: "Japanese Yen",
    });
    expect(screen.queryByRole("dialog", { name: "Currency picker" })).toBeNull();
  });

  it("moves to the active result with Enter when multiple currencies match", () => {
    const onCurrencySelect = vi.fn();
    const { trigger } = renderCurrencyPicker(onCurrencySelect);

    fireEvent.click(trigger);
    const searchInput = screen.getByRole("searchbox", { name: "Search currencies" });
    searchInput.focus();
    fireEvent.change(searchInput, { target: { value: "dollar" } });
    fireEvent.keyDown(searchInput, { key: "Enter" });

    expect(document.activeElement).toBe(
      screen.getByRole("button", { name: "USD, United States Dollar" })
    );
    expect(onCurrencySelect).not.toHaveBeenCalled();
    expect(screen.getByRole("dialog", { name: "Currency picker" })).toBeTruthy();
  });

  it("retains search focus when Enter is pressed with no results", () => {
    const { trigger } = renderCurrencyPicker();

    fireEvent.click(trigger);
    const searchInput = screen.getByRole("searchbox", { name: "Search currencies" });
    searchInput.focus();
    fireEvent.change(searchInput, { target: { value: "not-a-currency" } });
    fireEvent.keyDown(searchInput, { key: "Enter" });

    expect(document.activeElement).toBe(searchInput);
    expect(screen.getByRole("dialog", { name: "Currency picker" })).toBeTruthy();
  });

  it("moves from search to the active or last result with arrow keys", () => {
    const { trigger } = renderCurrencyPicker();

    fireEvent.click(trigger);
    const searchInput = screen.getByRole("searchbox", { name: "Search currencies" });
    searchInput.focus();
    fireEvent.change(searchInput, { target: { value: "dollar" } });

    fireEvent.keyDown(searchInput, { key: "ArrowDown" });
    expect(document.activeElement).toBe(
      screen.getByRole("button", { name: "USD, United States Dollar" })
    );

    searchInput.focus();
    fireEvent.keyDown(searchInput, { key: "ArrowUp" });
    expect(document.activeElement).toBe(
      screen.getByRole("button", { name: "TWD, New Taiwan Dollar" })
    );
  });

  it.each(["ArrowDown", "ArrowUp"])("opens from the trigger with %s", async (key) => {
    const { trigger } = renderCurrencyPicker();

    fireEvent.keyDown(trigger, { key });

    expect(screen.getByRole("dialog", { name: "Currency picker" })).toBeTruthy();
    await waitFor(() => {
      expect(document.activeElement).toBe(
        screen.getByRole("searchbox", { name: "Search currencies" })
      );
    });
  });

  it("moves between currencies with ArrowDown and ArrowUp", () => {
    const { trigger } = renderCurrencyPicker();

    fireEvent.click(trigger);
    const usd = screen.getByRole("button", { name: "USD, United States Dollar" });
    const eur = screen.getByRole("button", { name: "EUR, Euro" });
    usd.focus();

    fireEvent.keyDown(usd, { key: "ArrowDown" });
    expect(document.activeElement).toBe(eur);
    expect(eur.tabIndex).toBe(0);
    expect(usd.tabIndex).toBe(-1);

    fireEvent.keyDown(eur, { key: "ArrowUp" });
    expect(document.activeElement).toBe(usd);
  });

  it("wraps arrow-key navigation at both ends of the currency list", () => {
    const { trigger } = renderCurrencyPicker();

    fireEvent.click(trigger);
    const firstCurrency = screen.getByRole("button", { name: "USD, United States Dollar" });
    const lastCurrency = screen.getByRole("button", { name: "ZAR, South African Rand" });

    lastCurrency.focus();
    fireEvent.keyDown(lastCurrency, { key: "ArrowDown" });
    expect(document.activeElement).toBe(firstCurrency);

    fireEvent.keyDown(firstCurrency, { key: "ArrowUp" });
    expect(document.activeElement).toBe(lastCurrency);
  });

  it("moves to the first and last currencies with Home and End", () => {
    const { trigger } = renderCurrencyPicker();

    fireEvent.click(trigger);
    const firstCurrency = screen.getByRole("button", { name: "USD, United States Dollar" });
    const middleCurrency = screen.getByRole("button", { name: "EUR, Euro" });
    const lastCurrency = screen.getByRole("button", { name: "ZAR, South African Rand" });

    middleCurrency.focus();
    fireEvent.keyDown(middleCurrency, { key: "End" });
    expect(document.activeElement).toBe(lastCurrency);

    fireEvent.keyDown(lastCurrency, { key: "Home" });
    expect(document.activeElement).toBe(firstCurrency);
  });
});
