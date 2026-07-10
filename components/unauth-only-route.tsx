"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function UnauthOnlyRoute() {
  const router = useRouter();

  useEffect(() => {
    let isMounted = true;

    const redirectIfAuthenticated = async () => {
      const response = await fetch("/auth/session", { cache: "no-store" });
      const data = (await response.json()) as { authenticated?: boolean };

      if (isMounted && data.authenticated) {
        router.replace("/app");
      }
    };

    void redirectIfAuthenticated();
    window.addEventListener("pageshow", redirectIfAuthenticated);

    return () => {
      isMounted = false;
      window.removeEventListener("pageshow", redirectIfAuthenticated);
    };
  }, [router]);

  return null;
}
