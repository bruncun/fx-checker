"use client";

import { type AnchorHTMLAttributes, type MouseEvent, useReducer } from "react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type GuestModeLinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href" | "children"> & {
  href?: string;
  loadingLabel?: string;
  navigate?: (href: string) => void;
};

const GUEST_NAVIGATION_DELAY_MS = 75;

function pendingReducer() {
  return true;
}

function navigateToGuestMode(nextHref: string) {
  // Guest mode enters through a cookie-setting route handler; use a document visit.
  // eslint-disable-next-line @next/next/no-location-assign-relative-destination
  window.location.assign(new URL(nextHref, window.location.href));
}

function shouldShowPendingState(event: MouseEvent<HTMLAnchorElement>) {
  return (
    !event.defaultPrevented &&
    event.button === 0 &&
    !event.metaKey &&
    !event.altKey &&
    !event.ctrlKey &&
    !event.shiftKey &&
    event.currentTarget.target !== "_blank"
  );
}

export function GuestModeLink({
  className,
  href = "/guest",
  loadingLabel = "Entering guest mode...",
  navigate = navigateToGuestMode,
  onClick,
  ...props
}: GuestModeLinkProps) {
  const [isPending, showPendingState] = useReducer(pendingReducer, false);

  return (
    <a
      aria-disabled={isPending}
      className={cn(buttonVariants({ variant: "outline" }), className)}
      href={href}
      onClick={(event) => {
        onClick?.(event);

        if (shouldShowPendingState(event)) {
          event.preventDefault();
          if (isPending) {
            return;
          }

          showPendingState();
          window.setTimeout(() => {
            navigate(href);
          }, GUEST_NAVIGATION_DELAY_MS);
        }
      }}
      {...props}
    >
      {isPending ? loadingLabel : "Try as guest"}
    </a>
  );
}
