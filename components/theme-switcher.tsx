"use client";

import { cn } from "@/lib/utils";
import { Laptop, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";

function subscribe() {
  return () => {};
}

function getClientSnapshot() {
  return true;
}

function getServerSnapshot() {
  return false;
}

const ThemeSwitcher = () => {
  const mounted = useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot);
  const { theme, setTheme } = useTheme();

  if (!mounted) {
    return null;
  }

  const ICON_SIZE = 16;
  const Icon = theme === "light" ? Sun : theme === "dark" ? Moon : Laptop;

  return (
    <label
      className={cn(
        "relative inline-flex h-500 items-center rounded-8 bg-neutral-500 pr-050 pl-150 text-neutral-100",
        "shadow-[inset_0_0_0_1px_hsl(var(--neutral-400))] hover:bg-neutral-400",
        "focus-within:shadow-[inset_0_0_0_1px_hsl(var(--neutral-400)),0_0_0_3px_hsl(var(--neutral-600)),0_0_0_4px_hsl(var(--lime-500))]"
      )}
    >
      <span className="sr-only">Theme</span>
      <Icon size={ICON_SIZE} aria-hidden="true" className="mr-100 text-neutral-100" />
      <select
        aria-label="Theme"
        className="h-full appearance-none bg-transparent pr-250 pl-0 text-preset-5-medium text-neutral-50 outline-none"
        value={theme}
        onChange={(event) => setTheme(event.target.value)}
      >
        <option value="light">Light</option>
        <option value="dark">Dark</option>
        <option value="system">System</option>
      </select>
    </label>
  );
};

export { ThemeSwitcher };
