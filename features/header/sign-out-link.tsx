"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import type { MouseEvent } from "react";

export function SignOutLink() {
  const router = useRouter();

  async function signOut(event: MouseEvent<HTMLAnchorElement>) {
    event.preventDefault();

    const supabase = createClient();

    await supabase.auth.signOut();
    router.push("/auth/login");
    router.refresh();
  }

  return (
    <a
      className="rounded-4 text-neutral-50 underline-offset-4 hover:underline hover:decoration-neutral-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-lime-500"
      href="/auth/login"
      onClick={signOut}
    >
      Sign out
    </a>
  );
}
