"use client";

import * as React from "react";

import { CloseButton } from "@/components/ui/close-button";
import { GUEST_ALERT_DISMISSED_COOKIE } from "@/features/guest-session/model/guest-session";
import { cn } from "@/lib/utils";
import Link from "next/link";

const alertExitAnimationMs = 160;

export function DismissibleGuestPersistenceAlert() {
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
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-100 gap-y-050">
        <p id="guest-mode-alert-description" className="text-preset-5 text-neutral-100">
          Saved in this browser.
        </p>
        <Link
          className="rounded-4 text-preset-5-medium text-neutral-50 underline-offset-4 hover:underline hover:decoration-neutral-200 focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-lime-500"
          href="/auth/login"
          replace
        >
          Log in
        </Link>
        <span className="text-preset-5 text-neutral-100">or</span>
        <Link
          className="rounded-4 text-preset-5-medium text-neutral-50 underline-offset-4 hover:underline hover:decoration-neutral-200 focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-lime-500"
          href="/auth/sign-up"
          replace
        >
          sign up
        </Link>
        <p className="text-preset-5 text-neutral-100">to keep it across devices.</p>
      </div>
      <CloseButton
        aria-label="Dismiss saved data alert"
        disabled={isExiting}
        onClick={dismissAlert}
      />
    </div>
  );
}
