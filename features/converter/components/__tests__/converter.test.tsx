// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Converter, type SelectedCurrency } from "../converter";
import type { AvailableCurrency } from "../../currencies";
import type { Favorite } from "@/features/favorites";
import type { FrankfurterRate } from "@/lib/frankfurter";

const { createFavorite, routerRefresh, routerReplace, testSearchParams } = vi.hoisted(() => ({
  createFavorite: vi.fn(),
  routerRefresh: vi.fn(),
  routerReplace: vi.fn(),
  testSearchParams: { current: "" },
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
  useRouter: () => ({
    refresh: routerRefresh,
    replace: routerReplace,
  }),
  useSearchParams: () => new URLSearchParams(testSearchParams.current),
}));

vi.mock("@/features/favorites/actions", () => ({
  createFavorite,
  deleteFavorite: vi.fn(),
}));

vi.mock("@/features/conversion-log/client", () => ({
  createConversion: vi.fn(),
}));

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

function fulfilledPromise<T>(value: T) {
  return Object.assign(Promise.resolve(value), {
    status: "fulfilled" as const,
    value,
  });
}

function renderConverter({
  converterCurrencies = currencies,
  converterRates = rates,
  favorites = [],
  initialSelectedCurrencies = defaultSelectedCurrencies,
  searchParams,
}: {
  converterCurrencies?: AvailableCurrency[];
  converterRates?: FrankfurterRate[];
  favorites?: Favorite[];
  initialSelectedCurrencies?: {
    receiveCurrency: SelectedCurrency;
    sendCurrency: SelectedCurrency;
  };
  searchParams?: string;
} = {}) {
  if (searchParams !== undefined) {
    testSearchParams.current = searchParams;
  } else {
    testSearchParams.current = `from=${initialSelectedCurrencies.sendCurrency.currencyCode}&to=${initialSelectedCurrencies.receiveCurrency.currencyCode}`;
  }

  return render(
    <Converter
      currencies={converterCurrencies}
      favoritesPromise={fulfilledPromise(favorites)}
      rates={converterRates}
    />
  );
}

afterEach(() => {
  createFavorite.mockReset();
  routerRefresh.mockClear();
  routerReplace.mockClear();
  testSearchParams.current = "";
  vi.useRealTimers();
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

  it("optimistically favorites the selected pair", async () => {
    createFavorite.mockResolvedValue({
      createdAt: "2026-06-19T00:00:00.000Z",
      fromCurrency: "USD",
      id: "favorite-usd-eur",
      toCurrency: "EUR",
    });

    renderConverter();

    fireEvent.click(screen.getByRole("button", { name: "Favorite USD/EUR" }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Remove USD/EUR from favorites" })).toBeTruthy();
    });
    expect(createFavorite).toHaveBeenCalledWith({ fromCurrency: "USD", toCurrency: "EUR" });
  });

  it("debounces amount updates into the search params", () => {
    vi.useFakeTimers();

    renderConverter();

    vi.advanceTimersByTime(50);
    expect(routerReplace).not.toHaveBeenCalled();

    fireEvent.change(screen.getByRole("textbox", { name: "Send amount" }), {
      target: { value: "100" },
    });

    vi.advanceTimersByTime(49);
    expect(routerReplace).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(routerReplace).toHaveBeenCalledWith("/?from=USD&to=EUR&amount=100&amountSource=send", {
      scroll: false,
    });
  });

  it("does not update search params for formatting-only amount input changes", () => {
    vi.useFakeTimers();

    renderConverter({ searchParams: "from=USD&to=EUR&amount=100&amountSource=send" });

    fireEvent.change(screen.getByRole("textbox", { name: "Send amount" }), {
      target: { value: "1,00" },
    });
    vi.advanceTimersByTime(300);

    expect(routerReplace).not.toHaveBeenCalled();
  });
});
