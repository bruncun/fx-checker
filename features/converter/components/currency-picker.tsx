"use client";

import * as React from "react";
import { flushSync } from "react-dom";

import { cn } from "@/lib/utils";
import { CurrencyButton } from "@/components/ui/currency-button";
import { Flag, type FlagCountryCode } from "@/components/ui/flag";
import { Icon } from "@/components/ui/icon";
import { SearchInput } from "@/components/ui/search-input";
import { useOptionalKeyboardShortcuts } from "@/features/keyboard-shortcuts";
import { usePointerDownOutside } from "@/hooks/use-pointer-down-outside";
import { useRovingTabIndex } from "@/hooks/use-roving-tabindex";
import type { AvailableCurrency } from "../model/currencies";
import { getCurrencyGroups, type CurrencyPickerItem } from "../model/currency-groups";

const panelViewportGutter = 16;
const mobilePanelGap = 20;
const mobilePanelMinimumVisibleHeight = 111;
const mobilePickerScrollAnimationMs = 240;
const mobileTriggerIdealTop = 52;

function isPrintableSearchKey(event: React.KeyboardEvent) {
  return (
    event.key.length === 1 && event.key !== " " && !event.altKey && !event.ctrlKey && !event.metaKey
  );
}

function isCoarsePointer() {
  return window.matchMedia?.("(pointer: coarse)").matches ?? false;
}

function prefersReducedMotion() {
  return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
}

function getLockedBodyScrollY() {
  const top = Number.parseFloat(document.body.style.top);

  return Number.isFinite(top) && top < 0 ? Math.abs(top) : window.scrollY;
}

export interface CurrencyPickerProps {
  className?: string;
  countryCode: FlagCountryCode;
  currencies: AvailableCurrency[];
  currencyCode: string;
  flagFetchPriority?: React.ComponentProps<typeof CurrencyButton>["flagFetchPriority"];
  flagLoading?: React.ComponentProps<typeof CurrencyButton>["flagLoading"];
  ref?: React.Ref<CurrencyPickerHandle>;
  onPickerOpen?: () => void;
  onCurrencySelect?: (currency: CurrencyPickerItem) => void;
  left?: boolean;
}

export type CurrencyPickerHandle = {
  focusSearch: () => void;
  focusTrigger: () => void;
};

interface CurrencyItemProps {
  currency: CurrencyPickerItem;
  isActive: boolean;
  isSelected: boolean;
  onSelect: (currency: CurrencyPickerItem) => void;
}

function CurrencyItem({ currency, isActive, isSelected, onSelect }: CurrencyItemProps) {
  return (
    <li className="px-100">
      <button
        aria-current={isSelected ? "true" : undefined}
        aria-label={`${currency.code}, ${currency.name}`}
        className={cn(
          "fx-transition-surface flex w-full cursor-pointer items-center gap-150 rounded-4 border-y border-transparent p-150 py-150 text-left text-neutral-50",
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
  className,
  countryCode,
  currencies,
  currencyCode,
  flagFetchPriority,
  flagLoading,
  ref,
  onPickerOpen,
  onCurrencySelect,
  left = false,
}: CurrencyPickerProps) {
  const shortcuts = useOptionalKeyboardShortcuts();
  const [isOpen, setIsOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [activeCurrencyCode, setActiveCurrencyCode] = React.useState(currencyCode);
  const panelId = React.useId();
  const resultsId = React.useId();
  const rootRef = React.useRef<HTMLDivElement>(null);
  const panelRef = React.useRef<HTMLDivElement>(null);
  const resultsRef = React.useRef<HTMLDivElement>(null);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const searchRef = React.useRef<HTMLInputElement>(null);
  const mobilePickerInitialScrollYRef = React.useRef<number | null>(null);
  const mobilePickerScrollYRef = React.useRef<number | null>(null);
  const mobilePickerShouldAnimateRef = React.useRef(false);
  const rovingFocus = useRovingTabIndex<HTMLButtonElement>({
    containerRef: panelRef,
    itemSelector: "[data-currency-option]",
    onCurrentElementChange: (button) => {
      setActiveCurrencyCode(button.dataset.currencyCode ?? "");
    },
    orientation: "vertical",
  });
  const currencyGroups = getCurrencyGroups(currencies);

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
  const showCurrencyGroupHeaders = normalizedQuery.length === 0;
  const visibleCurrencies = filteredCurrencyGroups.flatMap((group) => group.currencies);
  const activeCurrency =
    visibleCurrencies.find((currency) => currency.code === activeCurrencyCode) ??
    visibleCurrencies[0];

  function getMobileScrollTarget() {
    const trigger = triggerRef.current;
    const root = rootRef.current;

    if (!trigger || !root || !isCoarsePointer()) {
      return null;
    }

    const visualViewport = window.visualViewport;
    const viewportTop = visualViewport?.offsetTop ?? 0;
    const viewportHeight = visualViewport?.height ?? window.innerHeight;
    const triggerRect = trigger.getBoundingClientRect();
    const triggerViewportTop = triggerRect.top - viewportTop;
    const panelViewportTop = triggerRect.bottom - viewportTop + mobilePanelGap;
    const panelOverflow =
      panelViewportTop + mobilePanelMinimumVisibleHeight + panelViewportGutter - viewportHeight;
    const triggerOverflow = triggerViewportTop - mobileTriggerIdealTop;
    const scrollDistance = Math.max(0, triggerOverflow, panelOverflow);

    if (scrollDistance <= 1) {
      return null;
    }

    const nextScrollY = Math.max(0, window.scrollY + scrollDistance);

    return Math.abs(nextScrollY - window.scrollY) > 1 ? nextScrollY : null;
  }

  function scrollTriggerIntoMobilePosition() {
    const nextScrollY = getMobileScrollTarget();
    const currentScrollY = window.scrollY;

    mobilePickerInitialScrollYRef.current = currentScrollY;
    if (nextScrollY === null) {
      mobilePickerScrollYRef.current = currentScrollY;
      mobilePickerShouldAnimateRef.current = false;
      return false;
    }

    mobilePickerScrollYRef.current = nextScrollY;
    mobilePickerShouldAnimateRef.current = !prefersReducedMotion();

    return true;
  }

  function focusSearchInput() {
    searchRef.current?.focus({ preventScroll: true });
    searchRef.current?.select();
  }

  function openPicker() {
    const initialCurrency = selectedCurrency ?? currencyGroups[0]?.currencies[0];

    setSearchQuery("");
    setActiveCurrencyCode(initialCurrency?.code ?? "");
    setIsOpen(true);
    onPickerOpen?.();
  }

  function finishOpeningPicker() {
    flushSync(openPicker);
    focusSearchInput();
  }

  function openPickerFromTrigger() {
    scrollTriggerIntoMobilePosition();
    finishOpeningPicker();
  }

  function focusSearch() {
    if (!isOpen) {
      openPicker();
      return;
    }

    requestAnimationFrame(() => {
      focusSearchInput();
    });
  }

  function focusTrigger() {
    triggerRef.current?.focus({ preventScroll: true });
  }

  React.useImperativeHandle(ref, () => ({ focusSearch, focusTrigger }));

  const updateAvailableHeight = React.useCallback(() => {
    const panel = panelRef.current;

    if (!panel) {
      return;
    }

    const visualViewport = window.visualViewport;
    const rootTop = rootRef.current?.getBoundingClientRect().top ?? 0;
    const panelTop = rootTop + panel.offsetTop;
    const isWebKit = typeof CSS !== "undefined" && CSS.supports("-webkit-backdrop-filter", "none");
    const viewportBottom = visualViewport
      ? visualViewport.height + (isWebKit ? 0 : visualViewport.offsetTop)
      : window.innerHeight;
    const availableHeight = Math.max(
      0,
      Math.floor(viewportBottom - panelTop - panelViewportGutter)
    );

    panel.style.setProperty("--currency-picker-available-height", `${availableHeight}px`);
    panel.style.setProperty("--currency-picker-panel-top", `${Math.max(0, panelTop)}px`);
  }, []);

  function closePicker(options?: { restoreFocus?: boolean }) {
    setIsOpen(false);

    if (options?.restoreFocus ?? true) {
      requestAnimationFrame(() => {
        triggerRef.current?.focus();
      });
    }
  }

  React.useLayoutEffect(() => {
    if (!isOpen) {
      return;
    }

    focusSearchInput();

    const panel = panelRef.current;

    if (!panel) {
      return;
    }

    updateAvailableHeight();
    window.addEventListener("resize", updateAvailableHeight);
    window.addEventListener("scroll", updateAvailableHeight, true);
    window.visualViewport?.addEventListener("resize", updateAvailableHeight);
    window.visualViewport?.addEventListener("scroll", updateAvailableHeight);

    return () => {
      window.removeEventListener("resize", updateAvailableHeight);
      window.removeEventListener("scroll", updateAvailableHeight, true);
      window.visualViewport?.removeEventListener("resize", updateAvailableHeight);
      window.visualViewport?.removeEventListener("scroll", updateAvailableHeight);
    };
  }, [isOpen, updateAvailableHeight]);

  React.useLayoutEffect(() => {
    const panel = panelRef.current;
    const results = resultsRef.current;

    if (!isOpen || !panel || !results) {
      return;
    }

    let lastTouchY = 0;

    const handleTouchStart = (event: TouchEvent) => {
      lastTouchY = event.touches[0]?.clientY ?? 0;
    };

    const handleTouchMove = (event: TouchEvent) => {
      const touch = event.touches[0];
      const target = event.target;

      if (!touch || !(target instanceof Node)) {
        return;
      }

      if (!panel.contains(target)) {
        return;
      }

      const deltaY = lastTouchY - touch.clientY;
      lastTouchY = touch.clientY;

      if (!results.contains(target)) {
        event.preventDefault();
        return;
      }

      const canScrollResults = results.scrollHeight > results.clientHeight;

      if (!canScrollResults) {
        event.preventDefault();
        return;
      }

      const isScrollingPastTop = results.scrollTop <= 0 && deltaY < 0;
      const isScrollingPastBottom =
        Math.ceil(results.scrollTop + results.clientHeight) >= results.scrollHeight && deltaY > 0;

      if (isScrollingPastTop || isScrollingPastBottom) {
        event.preventDefault();
      }
    };

    document.addEventListener("touchstart", handleTouchStart, { passive: true });
    document.addEventListener("touchmove", handleTouchMove, { passive: false });

    return () => {
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchmove", handleTouchMove);
    };
  }, [isOpen]);

  React.useLayoutEffect(() => {
    if (!isOpen || !isCoarsePointer()) {
      return;
    }

    const initialScrollY = mobilePickerInitialScrollYRef.current ?? window.scrollY;
    const scrollY = mobilePickerScrollYRef.current ?? initialScrollY;
    const shouldAnimate = mobilePickerShouldAnimateRef.current;
    let animationFrameId = 0;

    mobilePickerInitialScrollYRef.current = null;
    mobilePickerScrollYRef.current = null;
    mobilePickerShouldAnimateRef.current = false;

    const bodyStyle = document.body.style;
    const previousPosition = bodyStyle.position;
    const previousTop = bodyStyle.top;
    const previousWidth = bodyStyle.width;
    const previousOverflow = bodyStyle.overflow;

    bodyStyle.position = "fixed";
    bodyStyle.top = `-${initialScrollY}px`;
    bodyStyle.width = "100%";
    bodyStyle.overflow = "hidden";
    updateAvailableHeight();

    if (!shouldAnimate || Math.abs(scrollY - initialScrollY) <= 1) {
      bodyStyle.top = `-${scrollY}px`;
      updateAvailableHeight();
    } else {
      const startedAt = performance.now();
      const animateBodyOffset = (timestamp: number) => {
        const progress = Math.min(1, (timestamp - startedAt) / mobilePickerScrollAnimationMs);
        const easedProgress = 1 - (1 - progress) ** 3;
        const nextScrollY = initialScrollY + (scrollY - initialScrollY) * easedProgress;

        bodyStyle.top = `-${nextScrollY}px`;
        updateAvailableHeight();

        if (progress < 1) {
          animationFrameId = requestAnimationFrame(animateBodyOffset);
        }
      };

      animationFrameId = requestAnimationFrame(animateBodyOffset);
    }

    return () => {
      const lockedScrollY = getLockedBodyScrollY();

      if (animationFrameId !== 0) {
        cancelAnimationFrame(animationFrameId);
      }

      bodyStyle.position = previousPosition;
      bodyStyle.top = previousTop;
      bodyStyle.width = previousWidth;
      bodyStyle.overflow = previousOverflow;
      window.scrollTo({ top: lockedScrollY, behavior: "auto" });
    };
  }, [isOpen, updateAvailableHeight]);

  usePointerDownOutside({
    enabled: isOpen,
    onPointerDownOutside: () => {
      closePicker({ restoreFocus: false });
    },
    ref: rootRef,
  });

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
        rovingFocus.focusItem(
          currencyButtons.find((button) => button.tabIndex === 0) ?? currencyButtons[0]
        );
      }
      return true;
    }

    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      rovingFocus.focusItem(
        event.key === "ArrowUp"
          ? currencyButtons.at(-1)
          : (currencyButtons.find((button) => button.tabIndex === 0) ?? currencyButtons[0])
      );
      return true;
    }

    return false;
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
      rovingFocus.focusItem(
        currencyButtons.find((button) => button.tabIndex === 0) ?? currencyButtons[0]
      );
    }
  }

  function handlePanelKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      closePicker();
      return;
    }

    if (event.target === searchRef.current) {
      return;
    }

    if (rovingFocus.handleKeyDown(event)) {
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
    <div
      ref={rootRef}
      className={cn("relative inline-flex shrink-0", isOpen ? "z-[120]" : "z-[70]", className)}
    >
      <CurrencyButton
        ref={triggerRef}
        aria-controls={isOpen ? panelId : undefined}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        aria-label={selectedCurrency?.code ?? currencyCode}
        countryCode={selectedCurrency?.countryCode ?? countryCode}
        currencyCode={selectedCurrency?.code ?? currencyCode}
        flagFetchPriority={flagFetchPriority}
        flagLoading={flagLoading}
        onClick={() => {
          if (isOpen) {
            setIsOpen(false);
          } else {
            openPickerFromTrigger();
          }
        }}
        onKeyDown={(event) => {
          if (!isOpen && (event.key === "ArrowDown" || event.key === "ArrowUp")) {
            event.preventDefault();
            openPickerFromTrigger();
          }
        }}
      />

      {isOpen ? (
        <div
          ref={panelRef}
          aria-label="Currency picker"
          aria-modal="true"
          className={cn(
            "fx-panel-in absolute top-[calc(100%+20px)] right-[-16px] z-[100] flex max-h-[min(458px,var(--currency-picker-available-height,458px),calc(100svh_-_var(--currency-picker-panel-top,0px)_-_16px_-_env(safe-area-inset-bottom,0px)))] w-[min(calc(100vw-64px),472px)] max-w-[376px] flex-col overflow-hidden rounded-10 bg-neutral-600 pt-100 shadow-[inset_0_0_0_1px_hsl(var(--neutral-400)),var(--shadow-elevation-popover)] sm:top-[calc(100%+9.5px)] sm:max-h-[466px] sm:py-100 lg:right-0 lg:left-auto",
            left ? "sm:left-0" : "sm:right-0"
          )}
          id={panelId}
          onKeyDown={handlePanelKeyDown}
          role="dialog"
        >
          <SearchInput
            ref={searchRef}
            aria-controls={resultsId}
            aria-expanded={isOpen}
            className="mx-100 mb-125 shrink-0"
            inputClassName="origin-left scale-75 text-[16px] leading-[1.2]"
            onChange={(event) => {
              setSearchQuery(event.currentTarget.value);
            }}
            onKeyDown={handleSearchInputKeyDown}
            shortcutBadge={shortcuts?.formatShortcut({ key: "K", modifier: "primary" }) ?? "Ctrl K"}
            value={searchQuery}
          />

          <div
            ref={resultsRef}
            className="flex min-h-0 flex-col gap-025 overflow-y-auto overscroll-contain"
            aria-label="Currency results"
            data-currency-results-scroll
            data-test-id="currency-results"
            id={resultsId}
          >
            {filteredCurrencyGroups.map((group) => (
              <section key={group.label} aria-label={group.label}>
                {showCurrencyGroupHeaders ? (
                  <div className="mx-100 mb-050 flex items-center justify-between p-100 text-preset-5 text-neutral-200 uppercase shadow-[inset_0_-1px_0_0_hsl(var(--neutral-500))]">
                    <h3>{group.label}</h3>
                    <span>{group.count}</span>
                  </div>
                ) : null}

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

export { CurrencyPicker, getCurrencyGroups };
