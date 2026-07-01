// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useState } from "react";

import { Converter, type SelectedCurrency } from "../converter";
import type { AvailableCurrency } from "../../currencies";
import type { FrankfurterRate } from "@/lib/frankfurter";

const rates: FrankfurterRate[] = [
  { date: "2026-06-19", base: "EUR", quote: "USD", rate: 1.171 },
  { date: "2026-06-19", base: "EUR", quote: "JPY", rate: 183.24 },
];

const currencies: AvailableCurrency[] = [
  { code: "USD", countryCode: "us" as const, name: "United States Dollar" },
  { code: "EUR", countryCode: "eu" as const, name: "Euro" },
  { code: "JPY", countryCode: "jp" as const, name: "Japanese Yen" },
];

const defaultSelectedCurrencies = {
  sendCurrency: { countryCode: "us", currencyCode: "USD" } satisfies SelectedCurrency,
  receiveCurrency: { countryCode: "eu", currencyCode: "EUR" } satisfies SelectedCurrency,
};

function renderConverter({
  converterCurrencies = currencies,
  converterRates = rates,
  initialSelectedCurrencies = defaultSelectedCurrencies,
}: {
  converterCurrencies?: AvailableCurrency[];
  converterRates?: FrankfurterRate[];
  initialSelectedCurrencies?: {
    receiveCurrency: SelectedCurrency;
    sendCurrency: SelectedCurrency;
  };
} = {}) {
  function TestConverter() {
    const [selectedCurrencies, setSelectedCurrencies] = useState(initialSelectedCurrencies);

    return (
      <Converter
        currencies={converterCurrencies}
        rates={converterRates}
        sendCurrency={selectedCurrencies.sendCurrency}
        receiveCurrency={selectedCurrencies.receiveCurrency}
        onSelectedCurrenciesChange={setSelectedCurrencies}
      />
    );
  }

  return render(<TestConverter />);
}

afterEach(() => {
  cleanup();
});

describe("Converter", () => {
  it("converts from the send amount as it is edited", () => {
    renderConverter();

    const sendAmount = screen.getByRole("textbox", { name: "Send amount" });
    const receiveAmount = screen.getByRole("textbox", { name: "Receive amount" });

    fireEvent.change(sendAmount, { target: { value: "2500" } });

    expect(sendAmount).toHaveProperty("value", "2,500");
    expect(receiveAmount).toHaveProperty("value", "2,134.93");
  });

  it("converts back from the receive amount as it is edited", () => {
    renderConverter();

    const sendAmount = screen.getByRole("textbox", { name: "Send amount" });
    const receiveAmount = screen.getByRole("textbox", { name: "Receive amount" });

    fireEvent.change(receiveAmount, { target: { value: "2100.50" } });

    expect(receiveAmount).toHaveProperty("value", "2,100.50");
    expect(sendAmount).toHaveProperty("value", "2,459.69");
  });

  it("preserves significant digits for small converted amounts", () => {
    renderConverter({
      initialSelectedCurrencies: {
        sendCurrency: { countryCode: "jp", currencyCode: "JPY" },
        receiveCurrency: { countryCode: "eu", currencyCode: "EUR" },
      },
    });

    fireEvent.change(screen.getByRole("textbox", { name: "Send amount" }), {
      target: { value: "1" },
    });

    expect(screen.getByRole("textbox", { name: "Receive amount" })).toHaveProperty(
      "value",
      "0.005457"
    );
  });

  it("caps calculated amount precision at eight decimal places", () => {
    renderConverter({
      converterCurrencies: [
        currencies[0],
        { code: "TINY", countryCode: "eu", name: "Tiny Currency" },
      ],
      converterRates: [
        rates[0],
        { date: "2026-06-19", base: "EUR", quote: "TINY", rate: 0.0000001 },
      ],
      initialSelectedCurrencies: {
        sendCurrency: { countryCode: "us", currencyCode: "USD" },
        receiveCurrency: { countryCode: "eu", currencyCode: "TINY" },
      },
    });

    fireEvent.change(screen.getByRole("textbox", { name: "Send amount" }), {
      target: { value: "1" },
    });

    expect(screen.getByRole("textbox", { name: "Receive amount" })).toHaveProperty(
      "value",
      "0.00000009"
    );
  });

  it("keeps large calculated amounts editable without changing their magnitude", () => {
    renderConverter({
      converterCurrencies: [
        currencies[0],
        { code: "VND", countryCode: "vn", name: "Vietnamese Dong" },
      ],
      converterRates: [rates[0], { date: "2026-06-19", base: "EUR", quote: "VND", rate: 30_000 }],
      initialSelectedCurrencies: {
        sendCurrency: { countryCode: "us", currencyCode: "USD" },
        receiveCurrency: { countryCode: "vn", currencyCode: "VND" },
      },
    });

    fireEvent.change(screen.getByRole("textbox", { name: "Send amount" }), {
      target: { value: "999999999999" },
    });

    expect(screen.getByRole("textbox", { name: "Receive amount" })).toHaveProperty(
      "value",
      "25,619,128,949,590,093.94"
    );

    fireEvent.change(screen.getByRole("textbox", { name: "Receive amount" }), {
      target: { value: "25,619,128,949,590,093.94" },
    });

    expect(screen.getByRole("textbox", { name: "Receive amount" })).toHaveProperty(
      "value",
      "25,619,128,949,590,093.94"
    );
  });

  it("keeps both amounts empty while an amount is cleared", () => {
    renderConverter();

    const sendAmount = screen.getByRole("textbox", { name: "Send amount" });
    const receiveAmount = screen.getByRole("textbox", { name: "Receive amount" });

    fireEvent.change(sendAmount, { target: { value: "100" } });
    fireEvent.change(sendAmount, { target: { value: "" } });

    expect(sendAmount).toHaveProperty("value", "");
    expect(receiveAmount).toHaveProperty("value", "");
  });

  it("normalizes a trailing decimal point when an amount loses focus", () => {
    renderConverter();

    const sendAmount = screen.getByRole("textbox", { name: "Send amount" });

    fireEvent.change(sendAmount, { target: { value: "12." } });
    expect(sendAmount).toHaveProperty("value", "12.");

    fireEvent.blur(sendAmount);

    expect(sendAmount).toHaveProperty("value", "12");
  });

  it("swaps the active currencies and updates the displayed currency pair", () => {
    renderConverter();

    fireEvent.click(screen.getByRole("button", { name: "Exchange currencies" }));

    expect(screen.getByRole("button", { name: "Select send currency" }).textContent).toContain(
      "EUR"
    );
    expect(screen.getByRole("button", { name: "Select receive currency" }).textContent).toContain(
      "USD"
    );
    expect(screen.getByText("1 EUR = 1.1710 USD")).toBeTruthy();
  });

  it("keeps the send amount in place and recalculates the receive amount", () => {
    renderConverter();

    const sendAmount = screen.getByRole("textbox", { name: "Send amount" });
    const receiveAmount = screen.getByRole("textbox", { name: "Receive amount" });

    fireEvent.change(sendAmount, { target: { value: "100" } });
    fireEvent.click(screen.getByRole("button", { name: "Exchange currencies" }));

    expect(sendAmount).toHaveProperty("value", "100");
    expect(receiveAmount).toHaveProperty("value", "117.1");
  });

  it("does not change the amount source when a formatted derived amount blurs unchanged", () => {
    renderConverter();

    const sendAmount = screen.getByRole("textbox", { name: "Send amount" });
    const receiveAmount = screen.getByRole("textbox", { name: "Receive amount" });

    fireEvent.change(sendAmount, { target: { value: "2500" } });
    fireEvent.blur(receiveAmount);
    fireEvent.click(screen.getByRole("button", { name: "Exchange currencies" }));

    expect(sendAmount).toHaveProperty("value", "2,500");
    expect(receiveAmount).toHaveProperty("value", "2,927.5");
  });

  it("keeps the receive amount in place when it was edited most recently", () => {
    renderConverter();

    const sendAmount = screen.getByRole("textbox", { name: "Send amount" });
    const receiveAmount = screen.getByRole("textbox", { name: "Receive amount" });

    fireEvent.change(receiveAmount, { target: { value: "100" } });
    fireEvent.click(screen.getByRole("button", { name: "Exchange currencies" }));

    expect(sendAmount).toHaveProperty("value", "85.4");
    expect(receiveAmount).toHaveProperty("value", "100");
  });

  it("derives cross rates from the shared response base", () => {
    renderConverter();

    fireEvent.click(screen.getByRole("button", { name: "Select receive currency" }));
    fireEvent.click(screen.getByRole("button", { name: "JPY, Japanese Yen" }));

    expect(screen.getByText("1 USD = 156.4816 JPY")).toBeTruthy();
  });

  it("recalculates the receive amount when its currency changes", () => {
    renderConverter();

    fireEvent.change(screen.getByRole("textbox", { name: "Send amount" }), {
      target: { value: "100" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Select receive currency" }));
    fireEvent.click(screen.getByRole("button", { name: "JPY, Japanese Yen" }));

    expect(screen.getByRole("textbox", { name: "Receive amount" })).toHaveProperty(
      "value",
      "15,648.16"
    );
  });

  it("keeps the most recently edited amount as the source when a currency changes", () => {
    renderConverter();

    fireEvent.change(screen.getByRole("textbox", { name: "Receive amount" }), {
      target: { value: "100" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Select send currency" }));
    fireEvent.click(screen.getByRole("button", { name: "JPY, Japanese Yen" }));

    expect(screen.getByRole("textbox", { name: "Receive amount" })).toHaveProperty("value", "100");
    expect(screen.getByRole("textbox", { name: "Send amount" })).toHaveProperty("value", "18,324");
  });

  it("preserves significant digits for very small rates", () => {
    renderConverter({
      converterCurrencies: [
        ...currencies,
        { code: "VND", countryCode: "vn", name: "Vietnamese Dong" },
      ],
      converterRates: [...rates, { date: "2026-06-19", base: "EUR", quote: "VND", rate: 30_000 }],
    });

    fireEvent.click(screen.getByRole("button", { name: "Select send currency" }));
    fireEvent.click(screen.getByRole("button", { name: "VND, Vietnamese Dong" }));

    expect(screen.getByText("1 VND = 0.00003333 EUR")).toBeTruthy();
  });

  it("recalculates amounts when selected currencies change outside the converter", () => {
    function ControlledConverter() {
      const [selectedCurrencies, setSelectedCurrencies] = useState<{
        receiveCurrency: SelectedCurrency;
        sendCurrency: SelectedCurrency;
      }>({
        sendCurrency: { countryCode: "us", currencyCode: "USD" },
        receiveCurrency: { countryCode: "eu", currencyCode: "EUR" },
      });

      return (
        <>
          <button
            type="button"
            onClick={() =>
              setSelectedCurrencies({
                sendCurrency: { countryCode: "gb", currencyCode: "GBP" },
                receiveCurrency: { countryCode: "us", currencyCode: "USD" },
              })
            }
          >
            Select GBP/USD
          </button>
          <Converter
            currencies={[
              ...currencies,
              { code: "GBP", countryCode: "gb" as const, name: "British Pound" },
            ]}
            rates={[...rates, { date: "2026-06-19", base: "EUR", quote: "GBP", rate: 0.85 }]}
            sendCurrency={selectedCurrencies.sendCurrency}
            receiveCurrency={selectedCurrencies.receiveCurrency}
            onSelectedCurrenciesChange={setSelectedCurrencies}
          />
        </>
      );
    }

    render(<ControlledConverter />);

    fireEvent.change(screen.getByRole("textbox", { name: "Send amount" }), {
      target: { value: "100" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Select GBP/USD" }));

    expect(screen.getByRole("textbox", { name: "Receive amount" })).toHaveProperty(
      "value",
      "137.76"
    );
  });

  it("notifies when the selected pair favorite is toggled", () => {
    const onFavoriteToggle = vi.fn();

    render(
      <Converter
        currencies={currencies}
        rates={rates}
        sendCurrency={defaultSelectedCurrencies.sendCurrency}
        receiveCurrency={defaultSelectedCurrencies.receiveCurrency}
        onFavoriteToggle={onFavoriteToggle}
        onSelectedCurrenciesChange={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Favorite USD/EUR" }));

    expect(onFavoriteToggle).toHaveBeenCalledWith({ fromCurrency: "USD", toCurrency: "EUR" });
  });
});
