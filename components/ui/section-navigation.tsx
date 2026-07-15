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
type MenuPlacement = "bottom" | "top";

function getSectionAccessibleName(section: SectionNavigationItem | undefined) {
  if (!section) {
    return "";
  }

  return section.count === undefined ? section.label : `${section.label}, ${section.count}`;
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
  const [menuPlacement, setMenuPlacement] = React.useState<MenuPlacement>("bottom");
  const [animatedPlacement, setAnimatedPlacement] = React.useState<MenuPlacement | null>(null);
  const panelId = React.useId();
  const rootRef = React.useRef<HTMLDivElement>(null);
  const panelRef = React.useRef<HTMLDivElement>(null);
  const tabListRef = React.useRef<HTMLDivElement>(null);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const isPointerTabFocusRef = React.useRef(false);
  const activeItem = items.find((item) => item.value === value) ?? items[0];
  const activeLabel = activeItem?.label ?? "";
  const activeCount = activeItem?.count;
  const activeAccessibleName = getSectionAccessibleName(activeItem);

  const getMenuPlacement = React.useCallback(
    (currentPlacement: MenuPlacement) => {
      const trigger = triggerRef.current;

      if (!trigger) {
        return currentPlacement;
      }

      const visualViewport = window.visualViewport;
      const viewportTop = visualViewport?.offsetTop ?? 0;
      const viewportBottom = viewportTop + (visualViewport?.height ?? window.innerHeight);
      const triggerRect = trigger.getBoundingClientRect();
      const panelHeight = panelRef.current?.getBoundingClientRect().height;
      const estimatedMenuHeight = Math.min(
        items.length * mobileMenuRowHeight + mobileMenuPaddingY,
        mobileMenuComfortableHeight
      );
      const menuHeight = panelHeight && panelHeight > 0 ? panelHeight : estimatedMenuHeight;
      const menuTop = triggerRect.top - mobileMenuGap - menuHeight;
      const menuBottom = triggerRect.bottom + mobileMenuGap + menuHeight;
      const spaceBelow = viewportBottom - triggerRect.bottom - mobileMenuGap - mobileMenuGutter;
      const spaceAbove = triggerRect.top - viewportTop - mobileMenuGap - mobileMenuGutter;
      const topCollides = menuTop < viewportTop + mobileMenuGutter;
      const bottomCollides = menuBottom > viewportBottom - mobileMenuGutter;

      if (currentPlacement === "bottom" && bottomCollides && spaceAbove > spaceBelow) {
        return "top";
      }

      if (currentPlacement === "top" && topCollides && spaceBelow > spaceAbove) {
        return "bottom";
      }

      return currentPlacement;
    },
    [items.length]
  );

  function closeMenu(options?: { restoreFocus?: boolean }) {
    setIsOpen(false);
    setAnimatedPlacement(null);

    if (options?.restoreFocus ?? true) {
      requestAnimationFrame(() => {
        triggerRef.current?.focus({ preventScroll: true });
      });
    }
  }

  function openMenu() {
    setMenuPlacement(getMenuPlacement("bottom"));
    setAnimatedPlacement(null);
    setIsOpen(true);
  }

  const updateMenuPlacement = React.useCallback(() => {
    setMenuPlacement((currentPlacement) => {
      const nextPlacement = getMenuPlacement(currentPlacement);

      if (nextPlacement !== currentPlacement) {
        setAnimatedPlacement(nextPlacement);
      }

      return nextPlacement;
    });
  }, [getMenuPlacement]);

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

  React.useEffect(() => {
    if (!isOpen) {
      return;
    }

    window.addEventListener("scroll", updateMenuPlacement, { passive: true });
    window.addEventListener("resize", updateMenuPlacement);
    window.visualViewport?.addEventListener("scroll", updateMenuPlacement);
    window.visualViewport?.addEventListener("resize", updateMenuPlacement);

    return () => {
      window.removeEventListener("scroll", updateMenuPlacement);
      window.removeEventListener("resize", updateMenuPlacement);
      window.visualViewport?.removeEventListener("scroll", updateMenuPlacement);
      window.visualViewport?.removeEventListener("resize", updateMenuPlacement);
    };
  }, [isOpen, updateMenuPlacement]);

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
            menuPlacement === "top" ? "bottom-[calc(100%+8px)]" : "top-[calc(100%+8px)]",
            animatedPlacement === "top" && "fx-panel-flip-top",
            animatedPlacement === "bottom" && "fx-panel-flip-bottom"
          )}
          id={panelId}
          onAnimationEnd={() => {
            setAnimatedPlacement(null);
          }}
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
                if (isCurrent) {
                  return;
                }

                if (isPointerTabFocusRef.current) {
                  return;
                }

                onTabActivate?.(item);
              }}
              onPointerDown={() => {
                isPointerTabFocusRef.current = true;
              }}
              onPointerUp={() => {
                window.setTimeout(() => {
                  isPointerTabFocusRef.current = false;
                }, 0);
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
