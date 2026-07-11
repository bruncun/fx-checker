import {
  GUEST_ALERT_DISMISSED_COOKIE,
  GUEST_CONVERSIONS_COOKIE,
  GUEST_FAVORITES_COOKIE,
  GUEST_MODE_COOKIE,
} from "@/features/guest-session/model/guest-session";
import { createClient } from "@/lib/supabase/server";
import { hasEnvVars } from "@/lib/utils";
import { NextResponse, type NextRequest } from "next/server";

const guestSessionCookies = [
  GUEST_MODE_COOKIE,
  GUEST_FAVORITES_COOKIE,
  GUEST_CONVERSIONS_COOKIE,
  GUEST_ALERT_DISMISSED_COOKIE,
];

export async function POST(request: NextRequest) {
  const url = request.nextUrl.clone();
  url.pathname = "/auth/login";
  url.search = "";

  const response = NextResponse.redirect(url, 303);

  if (hasEnvVars) {
    const supabase = await createClient();

    await supabase.auth.signOut();
  }

  guestSessionCookies.forEach((name) => {
    response.cookies.set(name, "", {
      maxAge: 0,
      path: "/",
      sameSite: "lax",
    });
  });

  return response;
}
