"use client";

import { usePointerDownOutside } from "@/hooks/use-pointer-down-outside";
import { useRovingTabIndex } from "@/hooks/use-roving-tabindex";
import { Icon, type IconName } from "@/components/ui/icon";
import { useDataUnavailableError } from "@/features/home/hooks/use-data-unavailable-error";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";

type ThemeValue = "system" | "dark" | "light";

type UserDropdownProps = {
  isGuest?: boolean;
};

const themeOptions: { iconName: IconName; label: string; value: ThemeValue }[] = [
  { iconName: "system", label: "System", value: "system" },
  { iconName: "moon", label: "Dark", value: "dark" },
  { iconName: "sun", label: "Light", value: "light" },
];

function subscribeToHydration() {
  return () => {};
}

function getClientHydrationSnapshot() {
  return true;
}

function getServerHydrationSnapshot() {
  return false;
}

export function UserDropdown({ isGuest = false }: UserDropdownProps) {
  const router = useRouter();
  const { setTheme, theme } = useTheme();
  const hasMounted = React.useSyncExternalStore(
    subscribeToHydration,
    getClientHydrationSnapshot,
    getServerHydrationSnapshot
  );
  const [isOpen, setIsOpen] = React.useState(false);
  const [isSigningOut, setIsSigningOut] = React.useState(false);
  const panelId = React.useId();
  const rootRef = React.useRef<HTMLDivElement>(null);
  const panelRef = React.useRef<HTMLDivElement>(null);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const showDataUnavailableError = useDataUnavailableError();
  const activeTheme =
    hasMounted && themeOptions.some((option) => option.value === theme)
      ? (theme as ThemeValue)
      : "system";
  const menuFocus = useRovingTabIndex<HTMLElement>({
    containerRef: panelRef,
    itemSelector: "[data-user-menu-option]",
    onCurrentElementChange: (button) => {
      if (button.dataset.themeValue) {
        setTheme(button.dataset.themeValue);
      }
    },
    orientation: "vertical",
  });
  const themeFocus = useRovingTabIndex<HTMLButtonElement>({
    containerRef: panelRef,
    itemSelector: "[data-theme-option]",
    onCurrentElementChange: (button) => {
      setTheme(button.dataset.themeValue ?? "system");
    },
    orientation: "horizontal",
  });

  const resetDropdownState = React.useCallback(() => {
    setIsOpen(false);
    setIsSigningOut(false);
  }, []);

  React.useEffect(() => {
    window.addEventListener("pageshow", resetDropdownState);

    return () => {
      window.removeEventListener("pageshow", resetDropdownState);
      resetDropdownState();
    };
  }, [resetDropdownState]);

  function closeMenu(options?: { restoreFocus?: boolean }) {
    setIsOpen(false);

    if (options?.restoreFocus ?? true) {
      requestAnimationFrame(() => {
        triggerRef.current?.focus({ preventScroll: true });
      });
    }
  }

  function openMenu() {
    setIsOpen(true);
  }

  React.useLayoutEffect(() => {
    if (!isOpen) {
      return;
    }

    const menuButtons = menuFocus.getItems();
    const activeThemeButton =
      menuButtons.find((button) => button.dataset.themeValue === activeTheme) ?? menuButtons[0];

    menuButtons.forEach((button) => {
      button.tabIndex = button === activeThemeButton ? 0 : -1;
    });
    activeThemeButton?.focus({ preventScroll: true });
  }, [activeTheme, isOpen, menuFocus]);

  usePointerDownOutside({
    enabled: isOpen,
    onPointerDownOutside: () => {
      closeMenu({ restoreFocus: false });
    },
    ref: rootRef,
  });

  async function signOut() {
    if (isSigningOut) {
      return;
    }

    setIsSigningOut(true);
    closeMenu({ restoreFocus: false });

    try {
      const response = await fetch("/auth/sign-out", { method: "POST" });

      if (response.ok) {
        router.replace("/auth/login");
        router.refresh();
        setIsSigningOut(false);
        return;
      }

      console.error("Failed to sign out", new Error("Failed to sign out"));
      setIsSigningOut(false);
      showDataUnavailableError();
    } catch (error) {
      console.error("Failed to sign out", error);
      setIsSigningOut(false);
      showDataUnavailableError();
    }
  }

  function handlePanelKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      closeMenu();
      return;
    }

    if (event.key === "Tab") {
      const menuButtons = menuFocus.getItems();
      const currentIndex = menuButtons.findIndex((button) => button === document.activeElement);

      if (menuButtons.length === 0 || currentIndex === -1) {
        return;
      }

      event.preventDefault();
      const nextIndex = event.shiftKey
        ? (currentIndex - 1 + menuButtons.length) % menuButtons.length
        : (currentIndex + 1) % menuButtons.length;

      menuFocus.focusItem(menuButtons[nextIndex]);
      return;
    }

    if (
      document.activeElement instanceof HTMLElement &&
      document.activeElement.matches("[data-theme-option]") &&
      themeFocus.handleKeyDown(event)
    ) {
      return;
    }

    if (
      document.activeElement instanceof HTMLElement &&
      document.activeElement.matches("[data-theme-option]") &&
      (event.key === "ArrowDown" || event.key === "ArrowUp")
    ) {
      const menuButtons = menuFocus.getItems();

      event.preventDefault();
      menuFocus.focusItem(
        event.key === "ArrowDown" ? (menuButtons[1] ?? menuButtons[0]) : menuButtons.at(-1)
      );
      return;
    }

    menuFocus.handleKeyDown(event);
  }

  function renderThemeToggle({ menu }: { menu: boolean }) {
    return (
      <div
        aria-label="Theme"
        className="grid inline-block grid-cols-3 gap-025 rounded-8 p-025 shadow-[inset_0_0_0_1px_hsl(var(--neutral-400))]"
        role={menu ? "radiogroup" : "group"}
      >
        {themeOptions.map((option) => {
          const isActive = option.value === activeTheme;
          return (
            <button
              key={option.value}
              aria-label={option.label}
              {...(menu ? { "aria-checked": isActive, role: "radio" as const } : {})}
              aria-pressed={menu ? undefined : isActive}
              className={cn(
                "fx-transition-surface inline-flex cursor-pointer items-center justify-center rounded-8 px-100 py-100 text-neutral-200",
                "focus-visible:shadow-[0_0_0_3px_hsl(var(--neutral-600)),0_0_0_4px_hsl(var(--lime-500))] focus-visible:outline-none",
                isActive && "bg-neutral-500 text-neutral-50"
              )}
              data-theme-option={menu ? true : undefined}
              data-theme-value={option.value}
              data-user-menu-option={menu && isActive ? true : undefined}
              onClick={() => {
                setTheme(option.value);
              }}
              onFocus={() => {
                if (menu && !isActive) {
                  setTheme(option.value);
                }
              }}
              tabIndex={menu && !isActive ? -1 : 0}
              type="button"
            >
              <Icon decorative iconName={option.iconName} />
            </button>
          );
        })}
      </div>
    );
  }
  return (
    <div ref={rootRef} className="relative z-[90] inline-flex">
      <button
        ref={triggerRef}
        aria-busy={isSigningOut}
        aria-controls={isOpen ? panelId : undefined}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        aria-label={isSigningOut ? undefined : "Account menu"}
        className={cn(
          "fx-transition-surface relative inline-flex h-400 shrink-0 items-center justify-center gap-075 overflow-hidden rounded-8 bg-neutral-500 p-100 text-preset-5 text-neutral-50 uppercase lg:px-125",
          "shadow-[inset_0_0_0_1px_hsl(var(--neutral-400))] hover:bg-neutral-400 focus-visible:shadow-[inset_0_0_0_1px_hsl(var(--neutral-400)),0_0_0_3px_hsl(var(--neutral-600)),0_0_0_4px_hsl(var(--lime-500))] focus-visible:outline-none disabled:pointer-events-none disabled:opacity-80",
          isSigningOut && "cursor-wait"
        )}
        disabled={isSigningOut}
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
        {isSigningOut ? (
          <span>Exiting...</span>
        ) : (
          <>
            <Icon decorative iconName="user" />
            <span className="hidden sm:inline">Account</span>
            <Icon decorative height={12} iconName="chevron-down" width={12} />
          </>
        )}
      </button>

      {isOpen ? (
        <div
          ref={panelRef}
          aria-label="Account menu"
          aria-modal="true"
          className="fx-panel-in absolute top-[calc(100%+8px)] right-0 z-[100] flex w-[min(calc(100vw-32px),116px)] flex-col gap-100 rounded-10 bg-neutral-600 p-100 text-neutral-50 shadow-[inset_0_0_0_1px_hsl(var(--neutral-400)),var(--shadow-elevation-popover)]"
          id={panelId}
          onKeyDown={handlePanelKeyDown}
          role="dialog"
        >
          {renderThemeToggle({ menu: true })}

          {isGuest ? (
            <>
              <Link
                className="fx-transition-surface flex h-500 w-full items-center rounded-4 px-100 py-125 text-preset-5 text-neutral-50 uppercase hover:shadow-[inset_0_0_0_1px_hsl(var(--neutral-200))] focus:shadow-[inset_0_0_0_1px_hsl(var(--lime-500))] focus:outline-none"
                data-user-menu-option
                href="/auth/login"
                onClick={() => {
                  requestAnimationFrame(() => closeMenu({ restoreFocus: false }));
                }}
                replace
                tabIndex={-1}
              >
                Log in
              </Link>
              <Link
                className="fx-transition-surface flex h-500 w-full items-center rounded-4 px-100 py-125 text-preset-5 text-neutral-50 uppercase hover:shadow-[inset_0_0_0_1px_hsl(var(--neutral-200))] focus:shadow-[inset_0_0_0_1px_hsl(var(--lime-500))] focus:outline-none"
                data-user-menu-option
                href="/auth/sign-up"
                onClick={() => {
                  requestAnimationFrame(() => closeMenu({ restoreFocus: false }));
                }}
                replace
                tabIndex={-1}
              >
                Sign up
              </Link>
            </>
          ) : (
            <button
              className="fx-transition-surface flex h-500 w-full items-center rounded-4 px-100 py-125 text-preset-5 text-neutral-50 uppercase hover:shadow-[inset_0_0_0_1px_hsl(var(--neutral-200))] focus:shadow-[inset_0_0_0_1px_hsl(var(--lime-500))] focus:outline-none"
              data-user-menu-option
              onClick={signOut}
              tabIndex={-1}
              type="button"
            >
              Sign out
            </button>
          )}
        </div>
      ) : null}
    </div>
  );
}
