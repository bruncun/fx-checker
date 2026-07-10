"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function UnauthOnlyRoute() {
  const router = useRouter();

  useEffect(() => {
    let isMounted = true;
    const supabase = createClient();

    const redirectIfAuthenticated = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (isMounted && session) {
        router.replace("/app");
      }
    };

    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        router.replace("/app");
      }
    });

    void redirectIfAuthenticated();
    window.addEventListener("pageshow", redirectIfAuthenticated);

    return () => {
      isMounted = false;
      data.subscription.unsubscribe();
      window.removeEventListener("pageshow", redirectIfAuthenticated);
    };
  }, [router]);

  return null;
}
