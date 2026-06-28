"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { TabButton, TabCountBadge } from "@/components/ui/tab-button";
import { usePointerDownOutside } from "@/components/ui/use-pointer-down-outside";
import { useRovingTabIndex } from "@/components/ui/use-roving-tabindex";
import { cn } from "@/lib/utils";

export type SectionNavigationItem = {
  count?: number;
  href: string;
  label: string;
  value: string;
};

export interface SectionNavigationProps extends React.ComponentProps<"nav"> {
  "aria-label"?: string;
  activateOnFocus?: boolean;
  items: SectionNavigationItem[];
  onNavigate?: (item: SectionNavigationItem) => void;
  value: string;
}

function getSectionAccessibleName(section: SectionNavigationItem | undefined) {
  if (!section) {
    return "";
  }

  return section.count === undefined ? section.label : `${section.label}, ${section.count}`;
}

function SectionNavigation({
  activateOnFocus = false,
  "aria-label": ariaLabel = "Sections",
  className,
  items,
  onNavigate,
  value,
  ...props
}: SectionNavigationProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = React.useState(false);
  const panelId = React.useId();
  const rootRef = React.useRef<HTMLElement>(null);
  const panelRef = React.useRef<HTMLDivElement>(null);
  const tabListRef = React.useRef<HTMLDivElement>(null);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const activeItem = items.find((item) => item.value === value) ?? items[0];
  const activeLabel = activeItem?.label ?? "";
  const activeCount = activeItem?.count;
  const activeAccessibleName = getSectionAccessibleName(activeItem);
  const closeMenu = React.useCallback((options?: { restoreFocus?: boolean }) => {
    setIsOpen(false);

    if (options?.restoreFocus ?? true) {
      requestAnimationFrame(() => {
        triggerRef.current?.focus({ preventScroll: true });
      });
    }
  }, []);

  function openMenu() {
    setIsOpen(true);
  }

  const navigateTo = React.useCallback(
    (item: SectionNavigationItem, options?: { close?: boolean }) => {
      if (onNavigate) {
        onNavigate(item);
      } else {
        router.push(item.href, { scroll: false });
      }

      if (options?.close ?? true) {
        closeMenu();
      }
    },
    [closeMenu, onNavigate, router]
  );

  const rovingFocus = useRovingTabIndex<HTMLAnchorElement>({
    containerRef: panelRef,
    itemSelector: "[data-section-navigation-link]",
    onCurrentElementChange: React.useCallback(
      (element: HTMLAnchorElement) => {
        if (!activateOnFocus) {
          return;
        }

        const item = items.find((section) => section.value === element.dataset.sectionValue);

        if (!item || item.value === value) {
          return;
        }

        navigateTo(item, { close: false });
      },
      [activateOnFocus, items, navigateTo, value]
    ),
    orientation: "vertical",
  });
  const tabRovingFocus = useRovingTabIndex<HTMLButtonElement>({
    containerRef: tabListRef,
    itemSelector: "[data-section-navigation-tab]",
    onCurrentElementChange: React.useCallback(
      (element: HTMLButtonElement) => {
        const item = items.find((section) => section.value === element.dataset.sectionValue);

        if (!item || item.value === value) {
          return;
        }

        navigateTo(item, { close: false });
      },
      [items, navigateTo, value]
    ),
    orientation: "horizontal",
  });

  usePointerDownOutside({
    enabled: isOpen,
    onPointerDownOutside: React.useCallback(() => {
      closeMenu({ restoreFocus: false });
    }, [closeMenu]),
    ref: rootRef,
  });

  React.useLayoutEffect(() => {
    if (!isOpen) {
      return;
    }

    const links = rovingFocus.getItems();
    const activeLink = links.find((link) => link.dataset.sectionValue === value);
    const linkToFocus = activeLink ?? links[0];

    links.forEach((link) => {
      link.tabIndex = link === linkToFocus ? 0 : -1;
    });
    linkToFocus?.focus({ preventScroll: true });
  }, [isOpen, rovingFocus, value]);

  function handlePanelKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      closeMenu();
      return;
    }

    if (event.key === "Tab") {
      closeMenu({ restoreFocus: false });
      return;
    }

    rovingFocus.handleKeyDown(event);
  }

  return (
    <nav
      ref={rootRef}
      aria-label={ariaLabel}
      className={cn("relative w-full", className)}
      {...props}
    >
      <button
        ref={triggerRef}
        aria-controls={isOpen ? panelId : undefined}
        aria-expanded={isOpen}
        aria-label={`${ariaLabel}: ${activeAccessibleName}`}
        className={cn(
          "flex h-500 w-full items-center justify-between gap-200 rounded-4 rounded-8 bg-neutral-700 px-150 py-125 text-preset-3 text-neutral-50 uppercase shadow-[inset_0_0_0_1px_hsl(var(--neutral-400))] sm:hidden",
          "hover:bg-neutral-600 focus-visible:shadow-[inset_0_0_0_1px_hsl(var(--neutral-400)),0_0_0_3px_hsl(var(--neutral-600)),0_0_0_4px_hsl(var(--lime-500))] focus-visible:outline-none"
        )}
        onClick={() => {
          if (isOpen) {
            closeMenu({ restoreFocus: false });
          } else {
            openMenu();
          }
        }}
        onKeyDown={(event) => {
          if (!isOpen && (event.key === "ArrowDown" || event.key === "ArrowUp")) {
            event.preventDefault();
            openMenu();
          }
        }}
        type="button"
      >
        <span className="inline-flex items-center gap-100">
          <span>{activeLabel}</span>
          {activeCount !== undefined ? <TabCountBadge count={activeCount} /> : null}
        </span>
        <Image aria-hidden alt="" height={7} src="/images/angle-down.svg" width={11} />
      </button>

      {isOpen ? (
        <div
          ref={panelRef}
          className="absolute top-[calc(100%+8px)] right-0 left-0 z-50 rounded-10 bg-neutral-700 p-100 shadow-[inset_0_0_0_1px_hsl(var(--neutral-600)),0_20px_60px_0_rgb(10_10_10_/_0.50)] sm:hidden"
          id={panelId}
          onKeyDown={handlePanelKeyDown}
        >
          <ul>
            {items.map((item) => {
              const isCurrent = item.value === activeItem?.value;

              return (
                <li key={item.value}>
                  <Link
                    aria-current={isCurrent ? "page" : undefined}
                    aria-label={getSectionAccessibleName(item)}
                    className={cn(
                      "flex h-500 w-full items-center justify-between gap-200 rounded-4 px-100 py-125 text-left text-preset-3 text-neutral-50 uppercase",
                      "hover:shadow-[inset_0_0_0_1px_hsl(var(--neutral-200))] focus:shadow-[inset_0_0_0_1px_hsl(var(--lime-500))] focus:outline-none active:shadow-[inset_0_0_0_1px_hsl(var(--neutral-200))]"
                    )}
                    data-section-navigation-link
                    data-section-value={item.value}
                    href={item.href}
                    onClick={(event) => {
                      if (onNavigate) {
                        event.preventDefault();
                      }

                      navigateTo(item);
                    }}
                    scroll={false}
                    tabIndex={isCurrent ? 0 : -1}
                  >
                    <span>{item.label}</span>
                    {item.count !== undefined ? <TabCountBadge count={item.count} /> : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}

      <div
        ref={tabListRef}
        className="hidden w-full items-start gap-250 shadow-[inset_0_-1px_0_0_hsl(var(--neutral-600))] sm:flex sm:gap-100"
        aria-label={ariaLabel}
        onKeyDown={tabRovingFocus.handleKeyDown}
        role="tablist"
      >
        {items.map((item) => {
          const isCurrent = item.value === activeItem?.value;

          return (
            <TabButton
              key={item.value}
              active={isCurrent}
              aria-label={getSectionAccessibleName(item)}
              count={item.count}
              data-section-navigation-tab
              data-section-value={item.value}
              label={item.label}
              onClick={() => {
                if (!isCurrent) {
                  navigateTo(item, { close: false });
                }
              }}
              tabIndex={isCurrent ? 0 : -1}
            />
          );
        })}
      </div>
    </nav>
  );
}

export { SectionNavigation };
