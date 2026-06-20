"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import { CurrencyButton } from "@/components/ui/currency-button";
import { Flag, type FlagCountryCode } from "@/components/ui/flag";
import { Icon } from "@/components/ui/icon";
import { SearchInput } from "@/components/ui/search-input";

export type CurrencyPickerItem = {
  code: string;
  countryCode: FlagCountryCode;
  name: string;
};

type CurrencyPickerGroup = {
  count: number;
  currencies: CurrencyPickerItem[];
  label: string;
};

type CurrencyNavigationKey = "ArrowDown" | "ArrowUp" | "End" | "Home";

const currencyNavigationKeys: CurrencyNavigationKey[] = ["ArrowDown", "ArrowUp", "Home", "End"];

function isCurrencyNavigationKey(key: string): key is CurrencyNavigationKey {
  return currencyNavigationKeys.includes(key as CurrencyNavigationKey);
}

function isPrintableSearchKey(event: React.KeyboardEvent) {
  return (
    event.key.length === 1 && event.key !== " " && !event.altKey && !event.ctrlKey && !event.metaKey
  );
}

function getNextCurrencyIndex(currentIndex: number, key: CurrencyNavigationKey, itemCount: number) {
  if (key === "Home") {
    return 0;
  }

  if (key === "End") {
    return itemCount - 1;
  }

  return key === "ArrowDown"
    ? (currentIndex + 1) % itemCount
    : (currentIndex - 1 + itemCount) % itemCount;
}

const currencyGroups: CurrencyPickerGroup[] = [
  {
    count: 3,
    label: "Popular",
    currencies: [
      { code: "USD", countryCode: "us", name: "US Dollar" },
      { code: "EUR", countryCode: "eu", name: "Euro" },
      { code: "GBP", countryCode: "gb", name: "British Pound" },
    ],
  },
  {
    count: 52,
    label: "Other currencies",
    currencies: [
      { code: "AED", countryCode: "ae", name: "UAE Dirham" },
      { code: "ARS", countryCode: "ar", name: "Argentine Peso" },
      { code: "AUD", countryCode: "au", name: "Australian Dollar" },
      { code: "BDT", countryCode: "bd", name: "Bangladeshi Taka" },
      { code: "BGN", countryCode: "bg", name: "Bulgarian Lev" },
      { code: "BHD", countryCode: "bh", name: "Bahraini Dinar" },
      { code: "BRL", countryCode: "br", name: "Brazilian Real" },
      { code: "CAD", countryCode: "ca", name: "Canadian Dollar" },
      { code: "CHF", countryCode: "ch", name: "Swiss Franc" },
      { code: "CLP", countryCode: "cl", name: "Chilean Peso" },
      { code: "CNY", countryCode: "cn", name: "Chinese Yuan" },
      { code: "COP", countryCode: "co", name: "Colombian Peso" },
      { code: "CYP", countryCode: "cy", name: "Cypriot Pound" },
      { code: "CZK", countryCode: "cz", name: "Czech Koruna" },
      { code: "DKK", countryCode: "dk", name: "Danish Krone" },
      { code: "EGP", countryCode: "eg", name: "Egyptian Pound" },
      { code: "HKD", countryCode: "hk", name: "Hong Kong Dollar" },
      { code: "HRK", countryCode: "hr", name: "Croatian Kuna" },
      { code: "HUF", countryCode: "hu", name: "Hungarian Forint" },
      { code: "IDR", countryCode: "id", name: "Indonesian Rupiah" },
      { code: "INR", countryCode: "in", name: "Indian Rupee" },
      { code: "ISK", countryCode: "is", name: "Icelandic Krona" },
      { code: "JOD", countryCode: "jo", name: "Jordanian Dinar" },
      { code: "JPY", countryCode: "jp", name: "Japanese Yen" },
      { code: "KES", countryCode: "ke", name: "Kenyan Shilling" },
      { code: "KRW", countryCode: "kr", name: "South Korean Won" },
      { code: "KWD", countryCode: "kw", name: "Kuwaiti Dinar" },
      { code: "LKR", countryCode: "lk", name: "Sri Lankan Rupee" },
      { code: "MAD", countryCode: "ma", name: "Moroccan Dirham" },
      { code: "MXN", countryCode: "mx", name: "Mexican Peso" },
      { code: "MYR", countryCode: "my", name: "Malaysian Ringgit" },
      { code: "NGN", countryCode: "ng", name: "Nigerian Naira" },
      { code: "NOK", countryCode: "no", name: "Norwegian Krone" },
      { code: "NPR", countryCode: "np", name: "Nepalese Rupee" },
      { code: "NZD", countryCode: "nz", name: "New Zealand Dollar" },
      { code: "OMR", countryCode: "om", name: "Omani Rial" },
      { code: "PEN", countryCode: "pe", name: "Peruvian Sol" },
      { code: "PHP", countryCode: "ph", name: "Philippine Peso" },
      { code: "PKR", countryCode: "pk", name: "Pakistani Rupee" },
      { code: "PLN", countryCode: "pl", name: "Polish Zloty" },
      { code: "QAR", countryCode: "qa", name: "Qatari Riyal" },
      { code: "RON", countryCode: "ro", name: "Romanian Leu" },
      { code: "RUB", countryCode: "ru", name: "Russian Ruble" },
      { code: "SAR", countryCode: "sa", name: "Saudi Riyal" },
      { code: "SEK", countryCode: "se", name: "Swedish Krona" },
      { code: "SGD", countryCode: "sg", name: "Singapore Dollar" },
      { code: "THB", countryCode: "th", name: "Thai Baht" },
      { code: "TRY", countryCode: "tr", name: "Turkish Lira" },
      { code: "TWD", countryCode: "tw", name: "New Taiwan Dollar" },
      { code: "UAH", countryCode: "ua", name: "Ukrainian Hryvnia" },
      { code: "VND", countryCode: "vn", name: "Vietnamese Dong" },
      { code: "ZAR", countryCode: "za", name: "South African Rand" },
    ],
  },
];

export interface CurrencyPickerProps {
  "aria-label"?: string;
  className?: string;
  countryCode: FlagCountryCode;
  currencyCode: string;
  onCurrencySelect?: (currency: CurrencyPickerItem) => void;
  left?: boolean;
}

interface CurrencyItemProps {
  currency: CurrencyPickerItem;
  isActive: boolean;
  isSelected: boolean;
  onSelect: (currency: CurrencyPickerItem) => void;
}

function CurrencyItem({ currency, isActive, isSelected, onSelect }: CurrencyItemProps) {
  return (
    <li>
      <button
        aria-current={isSelected ? "true" : undefined}
        aria-label={`${currency.code}, ${currency.name}`}
        className={cn(
          "flex w-full items-center gap-150 rounded-4 border-y border-transparent px-200 py-150 text-left text-neutral-50",
          "hover:shadow-[inset_0_0_0_1px_hsl(var(--neutral-200))] focus:shadow-[inset_0_0_0_1px_hsl(var(--lime-500))] focus:outline-none"
        )}
        data-currency-code={currency.code}
        data-currency-option
        onClick={() => {
          onSelect(currency);
        }}
        tabIndex={isActive ? 0 : -1}
        type="button"
      >
        <Flag className="size-250" countryCode={currency.countryCode} alt="" />
        <span className="flex min-w-0 flex-1 items-baseline gap-150">
          <span className="text-preset-4">{currency.code}</span>
          <span className="truncate text-preset-5 text-neutral-200">{currency.name}</span>
        </span>
        {isSelected ? <Icon className="mr-050 size-150" decorative iconName="check" /> : null}
      </button>
    </li>
  );
}

function CurrencyPicker({
  "aria-label": ariaLabel = "Select currency",
  className,
  countryCode,
  currencyCode,
  onCurrencySelect,
  left = false,
}: CurrencyPickerProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [activeCurrencyCode, setActiveCurrencyCode] = React.useState(currencyCode);
  const panelId = React.useId();
  const rootRef = React.useRef<HTMLDivElement>(null);
  const panelRef = React.useRef<HTMLDivElement>(null);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const searchRef = React.useRef<HTMLInputElement>(null);

  const selectedCurrency =
    currencyGroups
      .flatMap((group) => group.currencies)
      .find((currency) => currency.code === currencyCode) ?? null;
  const normalizedQuery = searchQuery.trim().toLocaleLowerCase();
  const filteredCurrencyGroups = currencyGroups
    .map((group) => ({
      ...group,
      currencies: group.currencies.filter((currency) => {
        return (
          currency.code.toLocaleLowerCase().includes(normalizedQuery) ||
          currency.name.toLocaleLowerCase().includes(normalizedQuery)
        );
      }),
    }))
    .filter((group) => group.currencies.length > 0);
  const visibleCurrencies = filteredCurrencyGroups.flatMap((group) => group.currencies);
  const activeCurrency =
    visibleCurrencies.find((currency) => currency.code === activeCurrencyCode) ??
    visibleCurrencies[0];

  function openPicker() {
    const initialCurrency = selectedCurrency ?? currencyGroups[0]?.currencies[0];

    setSearchQuery("");
    setActiveCurrencyCode(initialCurrency?.code ?? "");
    setIsOpen(true);
  }

  const closePicker = React.useCallback((options?: { restoreFocus?: boolean }) => {
    setIsOpen(false);

    if (options?.restoreFocus ?? true) {
      requestAnimationFrame(() => {
        triggerRef.current?.focus();
      });
    }
  }, []);

  React.useLayoutEffect(() => {
    if (!isOpen) {
      return;
    }

    panelRef.current
      ?.querySelector<HTMLButtonElement>('[data-currency-option][tabindex="0"]')
      ?.focus();
  }, [currencyCode, isOpen]);

  React.useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      const root = rootRef.current;

      if (!root || root.contains(event.target as Node)) {
        return;
      }

      closePicker({ restoreFocus: false });
    }

    document.addEventListener("pointerdown", handlePointerDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [closePicker, isOpen]);

  function focusCurrencyButton(
    button: HTMLButtonElement | undefined,
    currencyButtons: HTMLButtonElement[]
  ) {
    if (!button) {
      return;
    }

    currencyButtons.forEach((currencyButton) => {
      currencyButton.tabIndex = currencyButton === button ? 0 : -1;
    });
    setActiveCurrencyCode(button.dataset.currencyCode ?? "");
    button.focus({ preventScroll: true });
    button.scrollIntoView?.({ block: "nearest" });
  }

  function handleSearchKeyDown(
    event: React.KeyboardEvent<HTMLElement>,
    currencyButtons: HTMLButtonElement[]
  ) {
    if (event.target !== searchRef.current) {
      return false;
    }

    if (event.key === "Enter") {
      event.preventDefault();

      if (currencyButtons.length === 1) {
        currencyButtons[0]?.click();
      } else if (currencyButtons.length > 1) {
        focusCurrencyButton(
          currencyButtons.find((button) => button.tabIndex === 0) ?? currencyButtons[0],
          currencyButtons
        );
      }
      return true;
    }

    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      focusCurrencyButton(
        event.key === "ArrowUp"
          ? currencyButtons.at(-1)
          : (currencyButtons.find((button) => button.tabIndex === 0) ?? currencyButtons[0]),
        currencyButtons
      );
      return true;
    }

    return false;
  }

  function handleCurrencyNavigationKeyDown(
    event: React.KeyboardEvent<HTMLDivElement>,
    currencyButtons: HTMLButtonElement[]
  ) {
    if (!isCurrencyNavigationKey(event.key)) {
      return false;
    }

    const currentIndex = currencyButtons.findIndex((button) => button === document.activeElement);

    if (currentIndex === -1) {
      return false;
    }

    event.preventDefault();
    const nextIndex = getNextCurrencyIndex(currentIndex, event.key, currencyButtons.length);
    focusCurrencyButton(currencyButtons[nextIndex], currencyButtons);
    return true;
  }

  function handleTypeToSearch(event: React.KeyboardEvent<HTMLDivElement>) {
    if (
      !isPrintableSearchKey(event) ||
      !(document.activeElement instanceof HTMLElement) ||
      !document.activeElement.matches("[data-currency-option]")
    ) {
      return false;
    }

    event.preventDefault();
    setSearchQuery((query) => `${query}${event.key}`);
    searchRef.current?.focus();
    return true;
  }

  function handleTabKeyDown(event: React.KeyboardEvent<HTMLElement>) {
    if (event.key !== "Tab") {
      return false;
    }

    if (
      document.activeElement instanceof HTMLElement &&
      document.activeElement.matches("[data-currency-option]")
    ) {
      event.preventDefault();
      searchRef.current?.focus();
      return true;
    }

    return false;
  }

  function handleSearchInputKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    const currencyButtons = Array.from(
      panelRef.current?.querySelectorAll<HTMLButtonElement>("[data-currency-option]") ?? []
    );

    if (handleSearchKeyDown(event, currencyButtons)) {
      event.stopPropagation();
      return;
    }

    if (event.key === "Tab") {
      event.preventDefault();
      event.stopPropagation();
      focusCurrencyButton(
        currencyButtons.find((button) => button.tabIndex === 0) ?? currencyButtons[0],
        currencyButtons
      );
    }
  }

  function handlePanelKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      closePicker();
      return;
    }

    const currencyButtons = Array.from(
      event.currentTarget.querySelectorAll<HTMLButtonElement>("[data-currency-option]")
    );

    if (event.target === searchRef.current) {
      return;
    }

    if (handleCurrencyNavigationKeyDown(event, currencyButtons)) {
      return;
    }

    if (handleTypeToSearch(event)) {
      return;
    }

    handleTabKeyDown(event);
  }

  function handleSelect(currency: CurrencyPickerItem) {
    onCurrencySelect?.(currency);
    closePicker();
  }

  return (
    <div ref={rootRef} className={cn("relative inline-flex shrink-0", className)}>
      <CurrencyButton
        ref={triggerRef}
        aria-controls={isOpen ? panelId : undefined}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        aria-label={ariaLabel}
        countryCode={selectedCurrency?.countryCode ?? countryCode}
        currencyCode={selectedCurrency?.code ?? currencyCode}
        onClick={() => {
          if (isOpen) {
            setIsOpen(false);
          } else {
            openPicker();
          }
        }}
        onKeyDown={(event) => {
          if (!isOpen && (event.key === "ArrowDown" || event.key === "ArrowUp")) {
            event.preventDefault();
            openPicker();
          }
        }}
      />

      {isOpen ? (
        <div
          ref={panelRef}
          aria-label="Currency picker"
          aria-modal="true"
          className={cn(
            "absolute top-[calc(100%+20px)] right-[-16px] z-50 flex max-h-[458px] w-[min(calc(100vw-64px),472px)] max-w-[376px] flex-col overflow-hidden rounded-10 bg-neutral-600 pt-100 shadow-[inset_0_0_0_1px_hsl(var(--neutral-400)),0_20px_60px_0_rgb(10_10_10_/_0.50)] sm:top-[calc(100%+9.5px)] sm:max-h-[466px] sm:py-100 lg:right-0 lg:left-auto",
            left ? "sm:left-0" : "sm:right-0"
          )}
          id={panelId}
          onKeyDown={handlePanelKeyDown}
          role="dialog"
        >
          <SearchInput
            ref={searchRef}
            className="mx-100 mb-125 shrink-0"
            onChange={(event) => {
              setSearchQuery(event.currentTarget.value);
            }}
            onKeyDown={handleSearchInputKeyDown}
            value={searchQuery}
          />

          <div className="flex min-h-0 flex-col gap-025 overflow-y-auto" data-currency-results>
            {filteredCurrencyGroups.map((group) => (
              <section key={group.label} aria-label={group.label}>
                <div className="mx-100 mb-050 flex items-center justify-between p-100 text-preset-5 text-neutral-200 uppercase shadow-[inset_0_-1px_0_0_hsl(var(--neutral-500))]">
                  <h3>{group.label}</h3>
                  <span>{normalizedQuery ? group.currencies.length : group.count}</span>
                </div>

                <ul>
                  {group.currencies.map((currency) => {
                    const isSelected = currency.code === currencyCode;

                    return (
                      <CurrencyItem
                        key={currency.code}
                        currency={currency}
                        isActive={currency.code === activeCurrency?.code}
                        isSelected={isSelected}
                        onSelect={handleSelect}
                      />
                    );
                  })}
                </ul>
              </section>
            ))}
            {visibleCurrencies.length === 0 ? (
              <p className="px-200 py-300 text-center text-preset-5 text-neutral-200" role="status">
                No currencies found.
              </p>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export { CurrencyPicker, currencyGroups };
