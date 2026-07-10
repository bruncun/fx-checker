import { updatePasswordAction } from "@/components/auth-actions";
import { NextResponse, type NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const state = await updatePasswordAction({ error: null }, formData);

  return NextResponse.json(state);
}
