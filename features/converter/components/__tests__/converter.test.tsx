// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { act } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Converter, type SelectedCurrency } from "../converter";
import { KeyboardShortcutsProvider } from "@/features/keyboard-shortcuts";
import type { AvailableCurrency } from "../../model/currencies";
import type { Favorite } from "@/features/favorites";
import type { FrankfurterRate } from "@/lib/frankfurter";

const {
  createConversion,
  createFavorite,
  routerRefresh,
  routerReplace,
  showDataUnavailableError,
  testSearchParams,
} = vi.hoisted(() => ({
  createConversion: vi.fn(),
  createFavorite: vi.fn(),
  routerRefresh: vi.fn(),
  routerReplace: vi.fn(),
  showDataUnavailableError: vi.fn(),
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

vi.mock("@/features/favorites/api/client", () => ({
  createFavorite,
  deleteFavorite: vi.fn(),
}));

vi.mock("@/features/conversion-log/api/client", () => ({
  createConversion,
}));

vi.mock("@/features/home/hooks/use-data-unavailable-error", () => ({
  useDataUnavailableError: () => showDataUnavailableError,
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
    <KeyboardShortcutsProvider>
      <Converter
        currencyReferencePromise={fulfilledPromise(converterCurrencies)}
        favoritesPromise={fulfilledPromise(favorites)}
        rates={converterRates}
      />
    </KeyboardShortcutsProvider>
  );
}

function getAmountInput(groupName: "Receive" | "Send") {
  return within(screen.getByRole("group", { name: groupName })).getByRole("textbox", {
    name: "Amount",
  });
}

afterEach(() => {
  createConversion.mockReset();
  createFavorite.mockReset();
  routerRefresh.mockClear();
  routerReplace.mockClear();
  showDataUnavailableError.mockClear();
  testSearchParams.current = "";
  vi.useRealTimers();
  cleanup();
  vi.restoreAllMocks();
});

describe("Converter", () => {
  it("converts from the send amount as it is edited", () => {
    renderConverter();

    const sendAmount = getAmountInput("Send");
    const receiveAmount = getAmountInput("Receive");

    fireEvent.change(sendAmount, { target: { value: "2500" } });

    expect(sendAmount).toHaveProperty("value", "2,500");
    expect(receiveAmount).toHaveProperty("value", "2,134.93");
  });

  it("loads a logged receive amount from the URL instead of recalculating it", () => {
    renderConverter({
      searchParams: "from=USD&to=EUR&amount=1000.00&amountSource=send&receiveAmount=853.02",
    });

    expect(getAmountInput("Send")).toHaveProperty("value", "1,000.00");
    expect(getAmountInput("Receive")).toHaveProperty("value", "853.02");
  });

  it("refreshes converter amounts when route search params change outside the converter", () => {
    const view = renderConverter({
      searchParams: "from=USD&to=EUR&amount=100&amountSource=send",
    });

    expect(getAmountInput("Send")).toHaveProperty("value", "100");

    testSearchParams.current =
      "from=USD&to=EUR&amount=1000.00&amountSource=send&receiveAmount=853.02";
    view.rerender(
      <KeyboardShortcutsProvider>
        <Converter
          currencyReferencePromise={fulfilledPromise(currencies)}
          favoritesPromise={fulfilledPromise([])}
          rates={rates}
        />
      </KeyboardShortcutsProvider>
    );

    expect(getAmountInput("Send")).toHaveProperty("value", "1,000.00");
    expect(getAmountInput("Receive")).toHaveProperty("value", "853.02");
  });

  it("converts back from the receive amount as it is edited", () => {
    renderConverter();

    const sendAmount = getAmountInput("Send");
    const receiveAmount = getAmountInput("Receive");

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

    fireEvent.change(getAmountInput("Send"), {
      target: { value: "1" },
    });

    expect(getAmountInput("Receive")).toHaveProperty("value", "0.005457");
  });

  it("caps calculated amount precision at eight decimal places", () => {
    renderConverter({
      converterCurrencies: [
        currencies[0],
        { code: "XCD", countryCode: "lc", name: "Tiny Currency" },
      ],
      converterRates: [
        rates[0],
        { date: "2026-06-19", base: "EUR", quote: "XCD", rate: 0.0000001 },
      ],
      initialSelectedCurrencies: {
        sendCurrency: { countryCode: "us", currencyCode: "USD" },
        receiveCurrency: { countryCode: "lc", currencyCode: "XCD" },
      },
    });

    fireEvent.change(getAmountInput("Send"), {
      target: { value: "1" },
    });

    expect(getAmountInput("Receive")).toHaveProperty("value", "0.00000009");
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

    fireEvent.change(getAmountInput("Send"), {
      target: { value: "999999999999" },
    });

    expect(getAmountInput("Receive")).toHaveProperty("value", "25,619,128,949,590,093.94");

    fireEvent.change(getAmountInput("Receive"), {
      target: { value: "25,619,128,949,590,093.94" },
    });

    expect(getAmountInput("Receive")).toHaveProperty("value", "25,619,128,949,590,093.94");
  });

  it("keeps both amounts empty while an amount is cleared", () => {
    renderConverter();

    const sendAmount = getAmountInput("Send");
    const receiveAmount = getAmountInput("Receive");

    fireEvent.change(sendAmount, { target: { value: "100" } });
    fireEvent.change(sendAmount, { target: { value: "" } });

    expect(sendAmount).toHaveProperty("value", "");
    expect(receiveAmount).toHaveProperty("value", "");
  });

  it("normalizes a trailing decimal point when an amount loses focus", () => {
    renderConverter();

    const sendAmount = getAmountInput("Send");

    fireEvent.change(sendAmount, { target: { value: "12." } });
    expect(sendAmount).toHaveProperty("value", "12.");

    fireEvent.blur(sendAmount);

    expect(sendAmount).toHaveProperty("value", "12");
  });

  it("swaps the active currencies, updates the URL, and refreshes the server tree", () => {
    const replaceState = vi.spyOn(window.history, "replaceState");

    renderConverter();

    fireEvent.click(screen.getByRole("button", { name: "Exchange currencies" }));

    expect(screen.getByRole("button", { name: "EUR" }).textContent).toContain("EUR");
    expect(screen.getByRole("button", { name: "USD" }).textContent).toContain("USD");
    expect(screen.getByText("1 EUR = 1.1710 USD")).toBeTruthy();
    expect(replaceState).toHaveBeenCalledWith(null, "", "/?from=EUR&to=USD");
    expect(routerRefresh).toHaveBeenCalled();
  });

  it("opens send currency search with the primary K shortcut", async () => {
    renderConverter();

    fireEvent.keyDown(window, {
      key: "k",
      ...(/Mac|iPhone|iPad|iPod/.test(navigator.platform) ? { metaKey: true } : { ctrlKey: true }),
    });

    await waitFor(() => {
      expect(document.activeElement).toBe(
        screen.getByRole("searchbox", { name: "Search currencies" })
      );
    });
    expect(screen.getByRole("dialog", { name: "Currency picker" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "USD" }).textContent).toContain("USD");
  });

  it("opens receive currency search after the receive amount was edited most recently", async () => {
    renderConverter();

    fireEvent.change(getAmountInput("Receive"), {
      target: { value: "25" },
    });
    fireEvent.keyDown(window, {
      key: "k",
      ...(/Mac|iPhone|iPad|iPod/.test(navigator.platform) ? { metaKey: true } : { ctrlKey: true }),
    });

    await waitFor(() => {
      expect(document.activeElement).toBe(
        screen.getByRole("searchbox", { name: "Search currencies" })
      );
    });
    expect(screen.getByRole("button", { name: "EUR" }).textContent).toContain("EUR");
    expect(screen.getByRole("dialog", { name: "Currency picker" })).toBeTruthy();
  });

  it("opens the last opened currency picker side after an amount edit", async () => {
    renderConverter();

    fireEvent.change(getAmountInput("Send"), {
      target: { value: "100" },
    });
    fireEvent.click(screen.getByRole("button", { name: "EUR" }));
    fireEvent.keyDown(screen.getByRole("dialog", { name: "Currency picker" }), { key: "Escape" });
    fireEvent.keyDown(window, {
      key: "k",
      ...(/Mac|iPhone|iPad|iPod/.test(navigator.platform) ? { metaKey: true } : { ctrlKey: true }),
    });

    await waitFor(() => {
      expect(document.activeElement).toBe(
        screen.getByRole("searchbox", { name: "Search currencies" })
      );
    });
    expect(screen.getByRole("button", { name: "EUR" }).textContent).toContain("EUR");
  });

  it("swaps currencies with X unless a text field is active", () => {
    const replaceState = vi.spyOn(window.history, "replaceState");

    renderConverter();

    fireEvent.keyDown(window, { key: "x" });

    expect(screen.getByRole("button", { name: "EUR" }).textContent).toContain("EUR");
    expect(screen.getByRole("button", { name: "USD" }).textContent).toContain("USD");
    expect(replaceState).toHaveBeenCalledWith(null, "", "/?from=EUR&to=USD");

    getAmountInput("Send").focus();
    fireEvent.keyDown(getAmountInput("Send"), { key: "x" });

    expect(replaceState).toHaveBeenCalledTimes(1);
  });

  it("keeps the send amount in place when currencies are swapped", () => {
    renderConverter();

    const sendAmount = getAmountInput("Send");
    const receiveAmount = getAmountInput("Receive");

    fireEvent.change(sendAmount, { target: { value: "100" } });
    fireEvent.click(screen.getByRole("button", { name: "Exchange currencies" }));

    expect(sendAmount).toHaveProperty("value", "100");
    expect(receiveAmount).toHaveProperty("value", "117.1");
  });

  it("does not change the amount source when currencies are swapped", () => {
    renderConverter();

    const sendAmount = getAmountInput("Send");
    const receiveAmount = getAmountInput("Receive");

    fireEvent.change(sendAmount, { target: { value: "2500" } });
    fireEvent.blur(receiveAmount);
    fireEvent.click(screen.getByRole("button", { name: "Exchange currencies" }));

    expect(sendAmount).toHaveProperty("value", "2,500");
    expect(receiveAmount).toHaveProperty("value", "2,927.5");
  });

  it("keeps the receive amount in place when currencies are swapped", () => {
    renderConverter();

    const sendAmount = getAmountInput("Send");
    const receiveAmount = getAmountInput("Receive");

    fireEvent.change(receiveAmount, { target: { value: "100" } });
    fireEvent.click(screen.getByRole("button", { name: "Exchange currencies" }));

    expect(sendAmount).toHaveProperty("value", "85.4");
    expect(receiveAmount).toHaveProperty("value", "100");
  });

  it("selects a receive currency, updates the URL, and refreshes the server tree", () => {
    const replaceState = vi.spyOn(window.history, "replaceState");

    renderConverter();

    fireEvent.click(screen.getByRole("button", { name: "EUR" }));
    fireEvent.click(screen.getByRole("button", { name: "JPY, Japanese Yen" }));

    expect(screen.getByText("1 USD = 156.4816 JPY")).toBeTruthy();
    expect(replaceState).toHaveBeenCalledWith(null, "", "/?from=USD&to=JPY");
    expect(routerRefresh).toHaveBeenCalled();
  });

  it("recalculates the receive amount when a receive currency is selected", () => {
    renderConverter();

    fireEvent.change(getAmountInput("Send"), {
      target: { value: "100" },
    });
    fireEvent.click(screen.getByRole("button", { name: "EUR" }));
    fireEvent.click(screen.getByRole("button", { name: "JPY, Japanese Yen" }));

    expect(getAmountInput("Receive")).toHaveProperty("value", "15,648.16");
  });

  it("keeps the most recently edited amount as the source when a send currency is selected", async () => {
    const replaceState = vi.spyOn(window.history, "replaceState");

    renderConverter();

    fireEvent.change(getAmountInput("Receive"), {
      target: { value: "100" },
    });
    fireEvent.click(screen.getByRole("button", { name: "USD" }));
    fireEvent.click(screen.getByRole("button", { name: "JPY, Japanese Yen" }));

    expect(getAmountInput("Send")).toHaveProperty("value", "18,324");
    expect(getAmountInput("Receive")).toHaveProperty("value", "100");
    expect(replaceState).toHaveBeenCalledWith(null, "", "/?from=JPY&to=EUR");
    await waitFor(() => {
      expect(document.activeElement).toBe(screen.getByRole("button", { name: "JPY" }));
    });
  });

  it("renders a very small rate immediately when a send currency is selected", () => {
    const replaceState = vi.spyOn(window.history, "replaceState");

    renderConverter({
      converterCurrencies: [
        ...currencies,
        { code: "VND", countryCode: "vn", name: "Vietnamese Dong" },
      ],
      converterRates: [...rates, { date: "2026-06-19", base: "EUR", quote: "VND", rate: 30_000 }],
    });

    fireEvent.click(screen.getByRole("button", { name: "USD" }));
    fireEvent.click(screen.getByRole("button", { name: "VND, Vietnamese Dong" }));

    expect(screen.getByText("1 VND = 0.00003333 EUR")).toBeTruthy();
    expect(replaceState).toHaveBeenCalledWith(null, "", "/?from=VND&to=EUR");
  });

  it("optimistically favorites the selected pair", async () => {
    createFavorite.mockResolvedValue({
      createdAt: "2026-06-19T00:00:00.000Z",
      fromCurrency: "USD",
      id: "favorite-usd-eur",
      toCurrency: "EUR",
    });

    renderConverter();

    fireEvent.click(screen.getByRole("button", { name: "Favorite" }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Remove" })).toBeTruthy();
    });
    expect(createFavorite).toHaveBeenCalledWith({ fromCurrency: "USD", toCurrency: "EUR" });
  });

  it("renders converter actions as independent buttons without a toolbar", () => {
    renderConverter();

    const favoriteButton = screen.getByRole("button", { name: "Favorite" });
    const logButton = screen.getByRole("button", { name: /Log .* USD to .* EUR/ });

    expect(screen.queryByRole("toolbar")).toBeNull();
    expect(favoriteButton.tabIndex).toBe(0);
    expect(logButton.tabIndex).toBe(0);
  });

  it("does not move focus between converter actions with arrow keys", () => {
    renderConverter();

    fireEvent.change(getAmountInput("Send"), {
      target: { value: "100" },
    });

    const favoriteButton = screen.getByRole("button", { name: "Favorite" });
    const logButton = screen.getByRole("button", { name: /Log .* USD to .* EUR/ });

    expect(favoriteButton.tabIndex).toBe(0);
    expect(logButton.tabIndex).toBe(0);

    favoriteButton.focus();
    fireEvent.keyDown(favoriteButton, { key: "ArrowRight" });

    expect(document.activeElement).toBe(favoriteButton);
    expect(favoriteButton.tabIndex).toBe(0);
    expect(logButton.tabIndex).toBe(0);

    logButton.focus();
    fireEvent.keyDown(logButton, { key: "ArrowLeft" });

    expect(document.activeElement).toBe(logButton);
    expect(favoriteButton.tabIndex).toBe(0);
    expect(logButton.tabIndex).toBe(0);
  });

  it("shows the data unavailable error when logging a conversion fails", async () => {
    createConversion.mockRejectedValue(new Error("Supabase failed"));

    renderConverter();

    fireEvent.click(screen.getByRole("button", { name: /Log .* USD to .* EUR/ }));

    await waitFor(() => {
      expect(showDataUnavailableError).toHaveBeenCalled();
    });
  });

  it("shows a brief logged state and suppresses repeat log clicks during acknowledgement", async () => {
    vi.useFakeTimers();
    createConversion.mockResolvedValue({
      createdAt: "2026-07-01T22:38:21.000Z",
      fromCurrency: "USD",
      id: "conversion-usd-eur",
      receiveAmount: "85.4",
      sendAmount: "100",
      toCurrency: "EUR",
    });

    renderConverter({ searchParams: "from=USD&to=EUR&amount=100&amountSource=send" });

    fireEvent.click(screen.getByRole("button", { name: /Log 100 USD to 85.4 EUR/ }));

    const loggedButton = screen.getByRole("button", { name: /Logged 100 USD to 85.4 EUR/ });

    expect(loggedButton.getAttribute("aria-disabled")).toBe("true");
    expect(loggedButton.getAttribute("aria-pressed")).toBe("true");
    expect(loggedButton.textContent).toContain("Logged");

    fireEvent.click(loggedButton);

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(createConversion).toHaveBeenCalledTimes(1);

    act(() => {
      vi.advanceTimersByTime(700);
    });

    expect(
      screen.getByRole("button", { name: /Log 100 USD to 85.4 EUR/ }).getAttribute("aria-pressed")
    ).toBe("false");
  });

  it("clears the logged acknowledgement when the conversion values change", () => {
    vi.useFakeTimers();
    createConversion.mockResolvedValue({
      createdAt: "2026-07-01T22:38:21.000Z",
      fromCurrency: "USD",
      id: "conversion-usd-eur",
      receiveAmount: "85.4",
      sendAmount: "100",
      toCurrency: "EUR",
    });

    renderConverter({ searchParams: "from=USD&to=EUR&amount=100&amountSource=send" });

    fireEvent.click(screen.getByRole("button", { name: /Log 100 USD to 85.4 EUR/ }));
    fireEvent.change(getAmountInput("Send"), {
      target: { value: "200" },
    });

    expect(screen.queryByRole("button", { name: /Logged/ })).toBeNull();
    expect(screen.getByRole("button", { name: /Log 200 USD to 170.79 EUR/ })).toBeTruthy();
  });

  it("persists amount updates into the URL without an app router navigation", () => {
    const replaceState = vi.spyOn(window.history, "replaceState");

    renderConverter();

    expect(routerReplace).not.toHaveBeenCalled();
    routerRefresh.mockClear();
    routerReplace.mockClear();
    replaceState.mockClear();

    fireEvent.change(getAmountInput("Send"), {
      target: { value: "100" },
    });

    expect(replaceState).toHaveBeenCalledWith(
      null,
      "",
      "/?from=USD&to=EUR&amount=100&amountSource=send"
    );
    expect(routerReplace).not.toHaveBeenCalled();
    expect(routerRefresh).not.toHaveBeenCalled();
  });

  it("does not update search params for formatting-only amount input changes", () => {
    const replaceState = vi.spyOn(window.history, "replaceState");

    renderConverter({ searchParams: "from=USD&to=EUR&amount=100&amountSource=send" });

    fireEvent.change(getAmountInput("Send"), {
      target: { value: "1,00" },
    });

    expect(replaceState).not.toHaveBeenCalled();
    expect(routerReplace).not.toHaveBeenCalled();
  });
});
