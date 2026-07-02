import { createClient } from "@/lib/supabase/server";
import { mapConversion, type Conversion } from "./conversion-log";

export async function getServerConversions(): Promise<Conversion[]> {
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
