import {
  GUEST_ALERT_DISMISSED_COOKIE,
  GUEST_CONVERSIONS_COOKIE,
  GUEST_FAVORITES_COOKIE,
  GUEST_MODE_COOKIE,
} from "@/features/guest-session/guest-session";
import { NextResponse, type NextRequest } from "next/server";

const guestSessionCookies = [
  GUEST_MODE_COOKIE,
  GUEST_FAVORITES_COOKIE,
  GUEST_CONVERSIONS_COOKIE,
  GUEST_ALERT_DISMISSED_COOKIE,
];

export function GET(request: NextRequest) {
  const url = request.nextUrl.clone();
  url.pathname = "/auth/login";
  url.search = "";

  const response = NextResponse.redirect(url);

  guestSessionCookies.forEach((name) => {
    response.cookies.set(name, "", {
      maxAge: 0,
      path: "/",
      sameSite: "lax",
    });
  });

  return response;
}
