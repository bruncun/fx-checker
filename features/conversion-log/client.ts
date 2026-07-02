import { createClient } from "@/lib/supabase/client";
import {
  mapConversion,
  normalizeConversionInput,
  type Conversion,
  type CreateConversionInput,
} from "./conversion-log";

const CONVERSION_SELECT = "id, from_currency, to_currency, send_amount, receive_amount, created_at";

export async function createConversion(input: CreateConversionInput): Promise<Conversion> {
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
