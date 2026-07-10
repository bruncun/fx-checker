import {
  addGuestConversion,
  GUEST_CONVERSIONS_COOKIE,
  GUEST_MODE_COOKIE,
  isGuestCookieValue,
  readGuestConversionsCookie,
  serializeGuestConversionsCookie,
  trimGuestConversions,
} from "@/features/guest-session/guest-session";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import {
  mapConversion,
  normalizeConversionInput,
  type Conversion,
  type CreateConversionInput,
} from "./conversion-log";

const CONVERSION_SELECT = "id, from_currency, to_currency, send_amount, receive_amount, created_at";

async function isGuestMode() {
  const cookieStore = await cookies();

  return isGuestCookieValue(cookieStore.get(GUEST_MODE_COOKIE)?.value);
}

async function getAuthenticatedUserContext() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    throw error;
  }

  if (!user) {
    throw new Error("You must be signed in to manage conversions.");
  }

  return { supabase, userId: user.id };
}

export async function createConversionAction(input: CreateConversionInput): Promise<Conversion> {
  if (await isGuestMode()) {
    const cookieStore = await cookies();
    const conversions = readGuestConversionsCookie(
      cookieStore.get(GUEST_CONVERSIONS_COOKIE)?.value
    );
    const conversion = addGuestConversion(input);

    cookieStore.set(
      GUEST_CONVERSIONS_COOKIE,
      serializeGuestConversionsCookie(trimGuestConversions([conversion, ...conversions])),
      { path: "/", sameSite: "lax" }
    );

    return conversion;
  }

  const { supabase, userId } = await getAuthenticatedUserContext();
  const normalizedInput = normalizeConversionInput(input);
  const { data, error } = await supabase
    .from("conversions")
    .insert({
      from_currency: normalizedInput.fromCurrency,
      receive_amount: normalizedInput.receiveAmount,
      send_amount: normalizedInput.sendAmount,
      to_currency: normalizedInput.toCurrency,
      user_id: userId,
    })
    .select(CONVERSION_SELECT)
    .single();

  if (error) {
    throw error;
  }

  return mapConversion(data);
}

export async function deleteConversionAction(id: string): Promise<void> {
  if (await isGuestMode()) {
    const cookieStore = await cookies();
    const conversions = readGuestConversionsCookie(
      cookieStore.get(GUEST_CONVERSIONS_COOKIE)?.value
    );

    cookieStore.set(
      GUEST_CONVERSIONS_COOKIE,
      serializeGuestConversionsCookie(conversions.filter((conversion) => conversion.id !== id)),
      { path: "/", sameSite: "lax" }
    );

    return;
  }

  const { supabase, userId } = await getAuthenticatedUserContext();
  const { error } = await supabase.from("conversions").delete().eq("id", id).eq("user_id", userId);

  if (error) {
    throw error;
  }
}

export async function deleteAllConversionsAction(): Promise<void> {
  if (await isGuestMode()) {
    const cookieStore = await cookies();

    cookieStore.set(GUEST_CONVERSIONS_COOKIE, serializeGuestConversionsCookie([]), {
      path: "/",
      sameSite: "lax",
    });

    return;
  }

  const { supabase, userId } = await getAuthenticatedUserContext();
  const { error } = await supabase.from("conversions").delete().eq("user_id", userId);

  if (error) {
    throw error;
  }
}
