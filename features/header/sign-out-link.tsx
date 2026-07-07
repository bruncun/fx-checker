"use client";

import { useDataUnavailableError } from "@/features/home/components/use-data-unavailable-error";
import {
  GUEST_ALERT_DISMISSED_COOKIE,
  GUEST_CONVERSIONS_COOKIE,
  GUEST_FAVORITES_COOKIE,
  GUEST_MODE_COOKIE,
} from "@/features/guest-session/guest-session";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import type { MouseEvent } from "react";

export function SignOutLink() {
  const router = useRouter();
  const showDataUnavailableError = useDataUnavailableError();

  async function signOut(event: MouseEvent<HTMLAnchorElement>) {
    event.preventDefault();

    if (document.cookie.includes(`${GUEST_MODE_COOKIE}=1`)) {
      document.cookie = `${GUEST_MODE_COOKIE}=; Path=/; SameSite=Lax; Max-Age=0`;
      document.cookie = `${GUEST_FAVORITES_COOKIE}=; Path=/; SameSite=Lax; Max-Age=0`;
      document.cookie = `${GUEST_CONVERSIONS_COOKIE}=; Path=/; SameSite=Lax; Max-Age=0`;
      document.cookie = `${GUEST_ALERT_DISMISSED_COOKIE}=; Path=/; SameSite=Lax; Max-Age=0`;
      router.push("/auth/login");
      router.refresh();
      return;
    }

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

  return (
    <a
      className="rounded-4 text-neutral-50 underline-offset-4 hover:underline hover:decoration-neutral-200 focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-lime-500"
      href="/auth/login"
      onClick={signOut}
    >
      Sign out
    </a>
  );
}
