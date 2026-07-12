import { createClient } from "@/lib/supabase/server";
import { isGuestModeFromCookies } from "@/features/guest-session/model/guest-session";
import { hasEnvVars } from "@/lib/utils";
import { cacheLife, cacheTag } from "next/cache";
import { cookies } from "next/headers";
import type { Conversion } from "../model/conversion-log";
import {
  createGuestConversionStore,
  createSupabaseConversionStore,
  type ConversionStore,
} from "../stores/store";

export const CONVERSIONS_CACHE_TAG = "conversions";

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
  "use cache: private";
  cacheTag(CONVERSIONS_CACHE_TAG);
  cacheLife("minutes");

  const store = await getConversionReadStore();

  return store.list();
}
