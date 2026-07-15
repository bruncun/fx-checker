"use client";

import Link from "next/link";
import type * as React from "react";

type FullPageAuthLinkProps = Omit<React.ComponentPropsWithoutRef<typeof Link>, "href"> & {
  href: string;
};

export function FullPageAuthLink({ href, onClick, ...props }: FullPageAuthLinkProps) {
  return (
    <Link
      href={href}
      onClick={(event) => {
        onClick?.(event);

        if (
          event.defaultPrevented ||
          event.metaKey ||
          event.ctrlKey ||
          event.shiftKey ||
          event.altKey
        ) {
          return;
        }

        event.preventDefault();
        // Standalone auth pages should keep the full-page auth context instead
        // of matching the root intercepted modal routes.
        // eslint-disable-next-line @next/next/no-location-assign-relative-destination
        window.location.assign(new URL(href, window.location.href));
      }}
      {...props}
    />
  );
}
