import { createClient } from "@/lib/supabase/server";
import {
  GUEST_CONVERSIONS_COOKIE,
  isGuestModeFromCookies,
  readGuestConversionsCookie,
} from "@/features/guest-session/guest-session";
import { hasEnvVars } from "@/lib/utils";
import { cookies } from "next/headers";
import { mapConversion, type Conversion } from "./conversion-log";

export async function getServerConversions(): Promise<Conversion[]> {
  const cookieStore = await cookies();

  if (
    isGuestModeFromCookies(cookieStore) ||
    !hasEnvVars ||
    process.env.FX_CHECKER_E2E_AUTH_BYPASS === "1"
  ) {
    return readGuestConversionsCookie(cookieStore.get(GUEST_CONVERSIONS_COOKIE)?.value);
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("conversions")
    .select("id, from_currency, to_currency, send_amount, receive_amount, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []).map(mapConversion);
}
