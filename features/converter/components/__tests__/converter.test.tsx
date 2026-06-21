// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { Converter } from "../converter";

const rates = [
  { date: "2026-06-19", base: "EUR", quote: "USD", rate: 1.171 },
  { date: "2026-06-19", base: "EUR", quote: "JPY", rate: 183.24 },
];

const currencies = [
  { code: "USD", countryCode: "us" as const, name: "United States Dollar" },
  { code: "EUR", countryCode: "eu" as const, name: "Euro" },
  { code: "JPY", countryCode: "jp" as const, name: "Japanese Yen" },
];

afterEach(() => {
  cleanup();
});

describe("Converter", () => {
  it("stores edited amounts in local state", () => {
    render(<Converter currencies={currencies} rates={rates} />);

    const sendAmount = screen.getByRole("textbox", { name: "Send amount" });
    const receiveAmount = screen.getByRole("textbox", { name: "Receive amount" });

    fireEvent.change(sendAmount, { target: { value: "2500" } });
    fireEvent.change(receiveAmount, { target: { value: "2100.50" } });

    expect(sendAmount).toHaveProperty("value", "2,500");
    expect(receiveAmount).toHaveProperty("value", "2,100.50");
  });

  it("swaps the active currencies and updates the displayed currency pair", () => {
    render(<Converter currencies={currencies} rates={rates} />);

    fireEvent.click(screen.getByRole("button", { name: "Exchange currencies" }));

    expect(screen.getByRole("button", { name: "Select send currency" }).textContent).toContain(
      "EUR"
    );
    expect(screen.getByRole("button", { name: "Select receive currency" }).textContent).toContain(
      "USD"
    );
    expect(screen.getByText("1 EUR = 1.1710 USD")).toBeTruthy();
  });

  it("derives cross rates from the shared response base", () => {
    render(<Converter currencies={currencies} rates={rates} />);

    fireEvent.click(screen.getByRole("button", { name: "Select receive currency" }));
    fireEvent.click(screen.getByRole("button", { name: "JPY, Japanese Yen" }));

    expect(screen.getByText("1 USD = 156.4816 JPY")).toBeTruthy();
  });

  it("preserves significant digits for very small rates", () => {
    render(
      <Converter
        currencies={[...currencies, { code: "VND", countryCode: "vn", name: "Vietnamese Dong" }]}
        rates={[...rates, { date: "2026-06-19", base: "EUR", quote: "VND", rate: 30_000 }]}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Select send currency" }));
    fireEvent.click(screen.getByRole("button", { name: "VND, Vietnamese Dong" }));

    expect(screen.getByText("1 VND = 0.00003333 EUR")).toBeTruthy();
  });

  it("chooses two distinct fallback currencies when USD is unavailable", () => {
    render(<Converter currencies={currencies.slice(1)} rates={rates} />);

    expect(screen.getByRole("button", { name: "Select send currency" }).textContent).toContain(
      "EUR"
    );
    expect(screen.getByRole("button", { name: "Select receive currency" }).textContent).toContain(
      "JPY"
    );
  });
});
