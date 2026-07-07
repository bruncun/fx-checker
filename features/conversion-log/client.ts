import { createClient } from "@/lib/supabase/client";
import {
  addGuestConversion,
  GUEST_CONVERSIONS_COOKIE,
  GUEST_MODE_COOKIE,
  readGuestConversionsCookie,
  serializeGuestConversionsCookie,
  trimGuestConversions,
} from "@/features/guest-session/guest-session";
import {
  mapConversion,
  normalizeConversionInput,
  type Conversion,
  type CreateConversionInput,
} from "./conversion-log";

const CONVERSION_SELECT = "id, from_currency, to_currency, send_amount, receive_amount, created_at";

function getCookieValue(name: string) {
  return document.cookie
    .split("; ")
    .find((cookie) => cookie.startsWith(`${name}=`))
    ?.slice(name.length + 1);
}

function setSessionCookie(name: string, value: string) {
  document.cookie = `${name}=${value}; Path=/; SameSite=Lax`;
}

function isGuestMode() {
  return getCookieValue(GUEST_MODE_COOKIE) === "1";
}

export async function createConversion(input: CreateConversionInput): Promise<Conversion> {
  if (isGuestMode()) {
    const conversions = readGuestConversionsCookie(getCookieValue(GUEST_CONVERSIONS_COOKIE));
    const conversion = addGuestConversion(input);

    setSessionCookie(
      GUEST_CONVERSIONS_COOKIE,
      serializeGuestConversionsCookie(trimGuestConversions([conversion, ...conversions]))
    );

    return conversion;
  }

  const supabase = createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw userError;
  }

  if (!user) {
    throw new Error("You must be signed in to log conversions.");
  }

  const normalizedInput = normalizeConversionInput(input);
  const { data, error } = await supabase
    .from("conversions")
    .insert({
      from_currency: normalizedInput.fromCurrency,
      receive_amount: normalizedInput.receiveAmount,
      send_amount: normalizedInput.sendAmount,
      to_currency: normalizedInput.toCurrency,
      user_id: user.id,
    })
    .select(CONVERSION_SELECT)
    .single();

  if (error) {
    throw error;
  }

  return mapConversion(data);
}

export async function deleteConversion(id: string): Promise<void> {
  if (isGuestMode()) {
    const conversions = readGuestConversionsCookie(getCookieValue(GUEST_CONVERSIONS_COOKIE));

    setSessionCookie(
      GUEST_CONVERSIONS_COOKIE,
      serializeGuestConversionsCookie(conversions.filter((conversion) => conversion.id !== id))
    );

    return;
  }

  const supabase = createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw userError;
  }

  if (!user) {
    throw new Error("You must be signed in to delete conversions.");
  }

  const { error } = await supabase.from("conversions").delete().eq("id", id).eq("user_id", user.id);

  if (error) {
    throw error;
  }
}

export async function deleteAllConversions(): Promise<void> {
  if (isGuestMode()) {
    setSessionCookie(GUEST_CONVERSIONS_COOKIE, serializeGuestConversionsCookie([]));

    return;
  }

  const supabase = createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw userError;
  }

  if (!user) {
    throw new Error("You must be signed in to clear conversions.");
  }

  const { error } = await supabase.from("conversions").delete().eq("user_id", user.id);

  if (error) {
    throw error;
  }
}
