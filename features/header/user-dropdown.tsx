"use client";

import { usePointerDownOutside } from "@/hooks/use-pointer-down-outside";
import { useRovingTabIndex } from "@/hooks/use-roving-tabindex";
import { Icon, type IconName } from "@/components/ui/icon";
import { PendingSpinner } from "@/components/ui/pending-spinner";
import { useDataUnavailableError } from "@/features/home/hooks/use-data-unavailable-error";
import { useOptionalKeyboardShortcuts } from "@/features/keyboard-shortcuts";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import * as React from "react";

type ThemeValue = "system" | "dark" | "light";

type UserDropdownProps = {
  email?: string | null;
  isGuest?: boolean;
};

const themeOptions: { iconName: IconName; label: string; value: ThemeValue }[] = [
  { iconName: "system", label: "System", value: "system" },
  { iconName: "moon", label: "Dark", value: "dark" },
  { iconName: "sun", label: "Light", value: "light" },
];

function getAccountInitials({ email, isGuest }: UserDropdownProps) {
  if (isGuest) {
    return "G";
  }

  return email?.trim().charAt(0).toLocaleUpperCase() || "";
}

export function UserDropdown({ email, isGuest = false }: UserDropdownProps) {
  const shortcuts = useOptionalKeyboardShortcuts();
  const router = useRouter();
  const { setTheme, theme } = useTheme();
  const [isOpen, setIsOpen] = React.useState(false);
  const [isSigningOut, setIsSigningOut] = React.useState(false);
  const panelId = React.useId();
  const rootRef = React.useRef<HTMLDivElement>(null);
  const panelRef = React.useRef<HTMLDivElement>(null);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const showDataUnavailableError = useDataUnavailableError();
  const activeTheme = themeOptions.some((option) => option.value === theme)
    ? (theme as ThemeValue)
    : "system";
  const initials = getAccountInitials({ email, isGuest });
  const menuFocus = useRovingTabIndex<HTMLButtonElement>({
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

      if (!response.ok) {
        throw new Error("Failed to sign out");
      }

      router.push("/auth/login");
      router.refresh();
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

    menuFocus.handleKeyDown(event);
  }

  return (
    <div ref={rootRef} className="relative z-[90] inline-flex">
      <button
        ref={triggerRef}
        aria-busy={isSigningOut}
        aria-controls={isOpen ? panelId : undefined}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        aria-label={isSigningOut ? "Signing out" : "Account menu"}
        className={cn(
          "fx-transition-surface relative inline-flex size-400 shrink-0 items-center justify-center overflow-hidden rounded-full bg-neutral-500 text-preset-6 text-neutral-50",
          "shadow-[inset_0_0_0_1px_hsl(var(--neutral-400))] hover:bg-neutral-400 focus-visible:shadow-[inset_0_0_0_1px_hsl(var(--neutral-400)),0_0_0_3px_hsl(var(--neutral-600)),0_0_0_4px_hsl(var(--lime-500))] focus-visible:outline-none",
          isSigningOut && "cursor-wait bg-transparent shadow-none hover:bg-transparent"
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
        <span
          aria-hidden="true"
          className={cn(
            "fx-transition-icon",
            isSigningOut ? "scale-75 opacity-0" : "scale-100 opacity-100"
          )}
        >
          {initials}
        </span>
        {isSigningOut ? (
          <PendingSpinner aria-hidden="true" className="absolute inset-0 size-400" />
        ) : null}
      </button>

      {isOpen ? (
        <div
          ref={panelRef}
          aria-label="Account menu"
          aria-modal="true"
          className="fx-panel-in absolute top-[calc(100%+8px)] right-0 z-[100] flex w-[min(calc(100vw-32px),220px)] flex-col gap-125 rounded-10 bg-neutral-600 p-100 text-neutral-50 shadow-[inset_0_0_0_1px_hsl(var(--neutral-400)),var(--shadow-elevation-popover)]"
          id={panelId}
          onKeyDown={handlePanelKeyDown}
          role="dialog"
        >
          <div
            aria-label="Theme"
            className="grid grid-cols-3 gap-025 rounded-8 p-025 shadow-[inset_0_0_0_1px_hsl(var(--neutral-400))]"
            role="radiogroup"
          >
            {themeOptions.map((option) => {
              const isActive = option.value === activeTheme;

              return (
                <button
                  key={option.value}
                  aria-checked={isActive}
                  aria-label={option.label}
                  className={cn(
                    "fx-transition-surface inline-flex h-400 cursor-pointer items-center justify-center rounded-8 p-100 text-neutral-200",
                    "focus-visible:shadow-[0_0_0_3px_hsl(var(--neutral-600)),0_0_0_4px_hsl(var(--lime-500))] focus-visible:outline-none",
                    isActive && "bg-neutral-500 text-neutral-50"
                  )}
                  data-theme-option
                  data-theme-value={option.value}
                  data-user-menu-option
                  onClick={() => {
                    setTheme(option.value);
                  }}
                  onFocus={() => {
                    if (!isActive) {
                      setTheme(option.value);
                    }
                  }}
                  role="radio"
                  tabIndex={isActive ? 0 : -1}
                  type="button"
                >
                  <Icon decorative iconName={option.iconName} />
                </button>
              );
            })}
          </div>

          <button
            className="fx-transition-surface flex h-500 w-full items-center justify-between gap-150 rounded-4 px-100 py-125 text-left text-preset-5 text-neutral-50 uppercase hover:shadow-[inset_0_0_0_1px_hsl(var(--neutral-200))] focus:shadow-[inset_0_0_0_1px_hsl(var(--lime-500))] focus:outline-none"
            data-user-menu-option
            onClick={(event) => {
              closeMenu({ restoreFocus: false });
              shortcuts?.openShortcutsDialog(triggerRef.current ?? event.currentTarget);
            }}
            tabIndex={-1}
            type="button"
          >
            <span>Keyboard Shortcuts</span>
            <kbd
              aria-hidden="true"
              className="pointer-events-none ml-auto shrink-0 rounded-4 px-100 py-050 text-preset-6 text-neutral-100 shadow-[inset_0_0_0_1px_hsl(var(--neutral-500))]"
            >
              {shortcuts?.formatShortcut({ key: "/", modifier: "primary" }) ?? "Ctrl /"}
            </kbd>
          </button>

          <button
            className="fx-transition-surface flex h-500 w-full items-center rounded-4 px-100 py-125 text-preset-5 text-neutral-50 uppercase hover:shadow-[inset_0_0_0_1px_hsl(var(--neutral-200))] focus:shadow-[inset_0_0_0_1px_hsl(var(--lime-500))] focus:outline-none"
            data-user-menu-option
            onClick={signOut}
            tabIndex={-1}
            type="button"
          >
            Sign out
          </button>
        </div>
      ) : null}
    </div>
  );
}

export { getAccountInitials };
