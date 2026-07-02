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
  const normalizedInput = normalizeConversionInput(input);
  const { data, error } = await supabase
    .from("conversions")
    .insert({
      from_currency: normalizedInput.fromCurrency,
      receive_amount: normalizedInput.receiveAmount,
      send_amount: normalizedInput.sendAmount,
      to_currency: normalizedInput.toCurrency,
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
  const { error } = await supabase.from("conversions").delete().eq("id", id);

  if (error) {
    throw error;
  }
}

export async function deleteAllConversions(): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("conversions").delete().not("id", "is", null);

  if (error) {
    throw error;
  }
}
