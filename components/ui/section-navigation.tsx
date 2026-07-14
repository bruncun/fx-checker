"use client";

import * as React from "react";
import Link from "next/link";

import { TabButton, TabCountBadge } from "@/components/ui/tab-button";
import { Icon } from "@/components/ui/icon";
import { usePointerDownOutside } from "@/hooks/use-pointer-down-outside";
import { useRovingTabIndex } from "@/hooks/use-roving-tabindex";
import { cn } from "@/lib/utils";

export type SectionNavigationItem = {
  count?: number;
  href: string;
  label: string;
  panelId?: string;
  tabId?: string;
  value: string;
};

export interface SectionNavigationProps extends React.ComponentPropsWithoutRef<"div"> {
  "aria-label"?: string;
  items: SectionNavigationItem[];
  onTabActivate?: (item: SectionNavigationItem) => void;
  value: string;
}

const mobileMenuGap = 8;
const mobileMenuGutter = 16;
const mobileMenuPaddingY = 16;
const mobileMenuRowHeight = 40;
const mobileMenuComfortableHeight = 240;
const mobileTriggerIdealTop = 52;

function getSectionAccessibleName(section: SectionNavigationItem | undefined) {
  if (!section) {
    return "";
  }

  return section.count === undefined ? section.label : `${section.label}, ${section.count}`;
}

function isCoarsePointer() {
  return window.matchMedia?.("(pointer: coarse)").matches ?? false;
}

function SectionNavigation({
  "aria-label": ariaLabel = "Sections",
  className,
  items,
  onTabActivate,
  value,
  ...props
}: SectionNavigationProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [menuPlacement, setMenuPlacement] = React.useState<"bottom" | "top">("bottom");
  const panelId = React.useId();
  const rootRef = React.useRef<HTMLDivElement>(null);
  const panelRef = React.useRef<HTMLDivElement>(null);
  const tabListRef = React.useRef<HTMLDivElement>(null);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const activeItem = items.find((item) => item.value === value) ?? items[0];
  const activeLabel = activeItem?.label ?? "";
  const activeCount = activeItem?.count;
  const activeAccessibleName = getSectionAccessibleName(activeItem);
  function closeMenu(options?: { restoreFocus?: boolean }) {
    setIsOpen(false);

    if (options?.restoreFocus ?? true) {
      requestAnimationFrame(() => {
        triggerRef.current?.focus({ preventScroll: true });
      });
    }
  }

  function openMenu() {
    const trigger = triggerRef.current;

    if (trigger) {
      const visualViewport = window.visualViewport;
      const viewportTop = visualViewport?.offsetTop ?? 0;
      const viewportBottom = viewportTop + (visualViewport?.height ?? window.innerHeight);
      const triggerRect = trigger.getBoundingClientRect();
      const triggerViewportTop = triggerRect.top - viewportTop;
      const menuHeight = items.length * mobileMenuRowHeight + mobileMenuPaddingY;
      const spaceBelow = viewportBottom - triggerRect.bottom - mobileMenuGap - mobileMenuGutter;
      const spaceAbove = triggerRect.top - viewportTop - mobileMenuGap - mobileMenuGutter;
      const comfortableHeight = Math.min(menuHeight, mobileMenuComfortableHeight);
      const scrollDistance = Math.max(0, triggerViewportTop - mobileTriggerIdealTop);

      if (isCoarsePointer() && scrollDistance > 1) {
        window.scrollTo({ behavior: "smooth", top: window.scrollY + scrollDistance });
      }

      setMenuPlacement(
        spaceBelow < comfortableHeight && spaceAbove > spaceBelow ? "top" : "bottom"
      );
    }

    setIsOpen(true);
  }

  const rovingFocus = useRovingTabIndex<HTMLAnchorElement>({
    containerRef: panelRef,
    itemSelector: "[data-section-navigation-link]",
    orientation: "vertical",
  });
  const tabRovingFocus = useRovingTabIndex<HTMLAnchorElement>({
    containerRef: tabListRef,
    itemSelector: "[data-section-navigation-tab]",
    orientation: "horizontal",
  });

  usePointerDownOutside({
    enabled: isOpen,
    onPointerDownOutside: () => {
      closeMenu({ restoreFocus: false });
    },
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
    <div ref={rootRef} className={cn("relative w-full", className)} {...props}>
      <button
        ref={triggerRef}
        aria-controls={isOpen ? panelId : undefined}
        aria-expanded={isOpen}
        aria-label={`${ariaLabel}: ${activeAccessibleName}`}
        className={cn(
          "fx-transition-surface flex h-500 w-full items-center justify-between gap-200 rounded-4 rounded-8 bg-neutral-700 px-150 py-125 text-preset-3 text-neutral-50 uppercase shadow-[inset_0_0_0_1px_hsl(var(--neutral-400))] sm:hidden",
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
        <Icon decorative height={7} iconName="chevron-down" width={11} />
      </button>

      {isOpen ? (
        <div
          ref={panelRef}
          className={cn(
            "fx-panel-in absolute right-0 left-0 z-50 rounded-10 bg-neutral-700 p-100 shadow-[inset_0_0_0_1px_hsl(var(--neutral-600)),var(--shadow-elevation-popover)] sm:hidden",
            menuPlacement === "top" ? "bottom-[calc(100%+8px)]" : "top-[calc(100%+8px)]"
          )}
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
                      "fx-transition-surface flex h-500 w-full items-center justify-between gap-200 rounded-4 px-100 py-125 text-left text-preset-3 text-neutral-50 uppercase",
                      "hover:shadow-[inset_0_0_0_1px_hsl(var(--neutral-200))] focus:shadow-[inset_0_0_0_1px_hsl(var(--lime-500))] focus:outline-none active:shadow-[inset_0_0_0_1px_hsl(var(--neutral-200))]"
                    )}
                    data-section-navigation-link
                    data-section-value={item.value}
                    href={item.href}
                    onClick={() => closeMenu()}
                    prefetch
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
              aria-controls={item.panelId}
              aria-label={getSectionAccessibleName(item)}
              data-section-navigation-tab
              data-section-value={item.value}
              count={item.count}
              href={item.href}
              id={item.tabId}
              label={item.label}
              onFocus={() => {
                if (!isCurrent) {
                  onTabActivate?.(item);
                }
              }}
              scroll={false}
              tabIndex={isCurrent ? 0 : -1}
            />
          );
        })}
      </div>
    </div>
  );
}

export { SectionNavigation };
