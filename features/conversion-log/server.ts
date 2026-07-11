import { createClient } from "@/lib/supabase/server";
import { isGuestModeFromCookies } from "@/features/guest-session/guest-session";
import { hasEnvVars } from "@/lib/utils";
import { cookies } from "next/headers";
import type { Conversion } from "./conversion-log";
import {
  createGuestConversionStore,
  createSupabaseConversionStore,
  type ConversionStore,
} from "./store";

async function getConversionReadStore(): Promise<ConversionStore> {
  const cookieStore = await cookies();

  if (
    isGuestModeFromCookies(cookieStore) ||
    !hasEnvVars ||
    process.env.FX_CHECKER_E2E_AUTH_BYPASS === "1"
  ) {
    return createGuestConversionStore(cookieStore);
  }

  const supabase = await createClient();
  return createSupabaseConversionStore({ supabase });
}

export async function getServerConversions(): Promise<Conversion[]> {
  const store = await getConversionReadStore();

  return store.list();
}
