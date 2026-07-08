"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { GUEST_ALERT_DISMISSED_COOKIE } from "@/features/guest-session/guest-session";
import { cn } from "@/lib/utils";

const alertExitAnimationMs = 160;

export function DismissibleGuestModeAlert() {
  const [isDismissed, setIsDismissed] = React.useState(false);
  const [isExiting, setIsExiting] = React.useState(false);
  const exitTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    return () => {
      if (exitTimeoutRef.current) {
        clearTimeout(exitTimeoutRef.current);
      }
    };
  }, []);

  function dismissAlert() {
    if (isExiting) {
      return;
    }

    document.cookie = `${GUEST_ALERT_DISMISSED_COOKIE}=1; Path=/; SameSite=Lax`;
    setIsExiting(true);
    exitTimeoutRef.current = setTimeout(() => {
      exitTimeoutRef.current = null;
      setIsDismissed(true);
    }, alertExitAnimationMs);
  }

  if (isDismissed) {
    return null;
  }

  return (
    <div
      aria-describedby="guest-mode-alert-description"
      aria-labelledby="guest-mode-alert-title"
      className={cn(
        "mb-250 items-center rounded-8 bg-neutral-600 p-200 shadow-[inset_0_0_0_1px_hsl(var(--lime-500))] sm:flex sm:items-center sm:justify-between sm:gap-300",
        isExiting && "fx-list-row-out"
      )}
      role="alert"
    >
      <div className="min-w-0">
        <h2 id="guest-mode-alert-title" className="text-preset-4 text-neutral-50 uppercase">
          Guest mode
        </h2>
        <p id="guest-mode-alert-description" className="mt-075 text-preset-5 text-neutral-100">
          Your data will not be stored to an account in guest mode and will be lost when the session
          ends.
        </p>
      </div>
      <Button
        className="mt-200 w-full sm:mt-0 sm:w-auto"
        type="button"
        variant="outline"
        disabled={isExiting}
        onClick={dismissAlert}
      >
        Dismiss
      </Button>
    </div>
  );
}
