import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  return NextResponse.json({ authenticated: Boolean(data?.claims) });
}
