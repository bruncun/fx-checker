"use client";

import { type AnchorHTMLAttributes, type MouseEvent, useState } from "react";
import { flushSync } from "react-dom";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type GuestModeLinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href" | "children"> & {
  href?: string;
  loadingLabel?: string;
  navigate?: (href: string) => void;
  size?: "default" | "sm" | "lg" | "icon";
};

const GUEST_NAVIGATION_DELAY_MS = 75;

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
  // Guest mode enters through a cookie-setting route handler; use a document visit.
  // eslint-disable-next-line @next/next/no-location-assign-relative-destination
  navigate = (nextHref) => window.location.assign(new URL(nextHref, window.location.href)),
  onClick,
  size = "default",
  ...props
}: GuestModeLinkProps) {
  const [isLoading, setIsLoading] = useState(false);

  return (
    <a
      aria-disabled={isLoading}
      className={cn(buttonVariants({ variant: "outline", size }), className)}
      href={href}
      onClick={(event) => {
        onClick?.(event);

        if (shouldShowPendingState(event)) {
          event.preventDefault();
          if (isLoading) {
            return;
          }

          flushSync(() => {
            setIsLoading(true);
          });
          window.setTimeout(() => {
            navigate(href);
          }, GUEST_NAVIGATION_DELAY_MS);
        }
      }}
      {...props}
    >
      {isLoading ? loadingLabel : "Try as guest"}
    </a>
  );
}
