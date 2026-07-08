"use client";

import { usePointerDownOutside } from "@/components/ui/use-pointer-down-outside";
import { useRovingTabIndex } from "@/components/ui/use-roving-tabindex";
import { Icon, type IconName } from "@/components/ui/icon";
import { useDataUnavailableError } from "@/features/home/components/use-data-unavailable-error";
import { GUEST_MODE_COOKIE } from "@/features/guest-session/guest-session";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import * as React from "react";
import type { MouseEvent } from "react";

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
  const router = useRouter();
  const { setTheme, theme } = useTheme();
  const [isOpen, setIsOpen] = React.useState(false);
  const panelId = React.useId();
  const rootRef = React.useRef<HTMLDivElement>(null);
  const panelRef = React.useRef<HTMLDivElement>(null);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const showDataUnavailableError = useDataUnavailableError();
  const activeTheme = themeOptions.some((option) => option.value === theme)
    ? (theme as ThemeValue)
    : "system";
  const initials = getAccountInitials({ email, isGuest });
  const rovingFocus = useRovingTabIndex<HTMLButtonElement>({
    containerRef: panelRef,
    itemSelector: "[data-theme-option]",
    onCurrentElementChange: (button) => {
      setTheme(button.dataset.themeValue ?? "system");
    },
    orientation: "horizontal",
  });

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

    const themeButtons = rovingFocus.getItems();
    const activeThemeButton =
      themeButtons.find((button) => button.dataset.themeValue === activeTheme) ?? themeButtons[0];

    themeButtons.forEach((button) => {
      button.tabIndex = button === activeThemeButton ? 0 : -1;
    });
    activeThemeButton?.focus({ preventScroll: true });
  }, [activeTheme, isOpen, rovingFocus]);

  usePointerDownOutside({
    enabled: isOpen,
    onPointerDownOutside: () => {
      closeMenu({ restoreFocus: false });
    },
    ref: rootRef,
  });

  async function signOut(event: MouseEvent<HTMLAnchorElement>) {
    closeMenu({ restoreFocus: false });

    if (document.cookie.includes(`${GUEST_MODE_COOKIE}=1`)) {
      return;
    }

    event.preventDefault();

    const supabase = createClient();

    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        throw error;
      }

      router.push("/auth/login");
      router.refresh();
    } catch (error) {
      console.error("Failed to sign out", error);
      showDataUnavailableError();
    }
  }

  function handlePanelKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      closeMenu();
      return;
    }

    rovingFocus.handleKeyDown(event);
  }

  return (
    <div ref={rootRef} className="relative inline-flex">
      <button
        ref={triggerRef}
        aria-controls={isOpen ? panelId : undefined}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        aria-label="Account menu"
        className={cn(
          "inline-flex size-400 shrink-0 items-center justify-center rounded-full bg-neutral-500 text-preset-6 text-neutral-50",
          "shadow-[inset_0_0_0_1px_hsl(var(--neutral-400))] hover:bg-neutral-400 focus-visible:shadow-[inset_0_0_0_1px_hsl(var(--neutral-400)),0_0_0_3px_hsl(var(--neutral-700)),0_0_0_4px_hsl(var(--lime-500))] focus-visible:outline-none"
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
        {initials}
      </button>

      {isOpen ? (
        <div
          ref={panelRef}
          aria-label="Account menu"
          aria-modal="true"
          className="absolute top-[calc(100%+8px)] right-0 z-50 flex w-[min(calc(100vw-32px),119px)] flex-col gap-125 rounded-10 bg-neutral-600 p-100 text-neutral-50 shadow-[inset_0_0_0_1px_hsl(var(--neutral-400)),var(--shadow-elevation-popover)]"
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
                    "inline-flex h-400 cursor-pointer items-center justify-center rounded-8 p-100 text-neutral-200",
                    "focus-visible:shadow-[0_0_0_3px_hsl(var(--neutral-700)),0_0_0_4px_hsl(var(--lime-500))] focus-visible:outline-none",
                    isActive && "bg-neutral-500 text-neutral-50"
                  )}
                  data-theme-option
                  data-theme-value={option.value}
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

          <a
            className="flex h-500 w-full items-center rounded-4 px-100 py-125 text-preset-5 text-neutral-50 uppercase hover:shadow-[inset_0_0_0_1px_hsl(var(--neutral-200))] focus:shadow-[inset_0_0_0_1px_hsl(var(--lime-500))] focus:outline-none"
            href="/auth/sign-out"
            onClick={signOut}
          >
            Sign out
          </a>
        </div>
      ) : null}
    </div>
  );
}

export { getAccountInitials };
