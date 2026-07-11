"use client";

import * as React from "react";

import { CloseButton } from "@/components/ui/close-button";
import { GUEST_ALERT_DISMISSED_COOKIE } from "@/features/guest-session/model/guest-session";
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
      className={cn(
        "mb-250 flex items-center gap-200 rounded-8 bg-neutral-600 p-100 shadow-[inset_0_0_0_1px_hsl(var(--lime-500))]",
        isExiting && "fx-list-row-out"
      )}
      role="alert"
    >
      <div className="flex min-w-0 flex-1">
        <p id="guest-mode-alert-description" className="text-preset-5 text-neutral-100">
          Your data will not be stored to an account in guest mode and will be lost when the session
          ends.
        </p>
      </div>
      <CloseButton
        aria-label="Dismiss guest mode alert"
        disabled={isExiting}
        onClick={dismissAlert}
      />
    </div>
  );
}
