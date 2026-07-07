import {
  GUEST_ALERT_DISMISSED_COOKIE,
  GUEST_MODE_COOKIE,
} from "@/features/guest-session/guest-session";
import { NextResponse, type NextRequest } from "next/server";

function getSafeRedirectPath(redirectTo: string | null) {
  if (!redirectTo?.startsWith("/") || redirectTo.startsWith("//")) {
    return "/app";
  }

  return redirectTo;
}

function getGuestRedirectPath(redirectPath: string) {
  if (redirectPath === "/" || redirectPath.startsWith("/auth")) {
    return "/app";
  }

  return redirectPath;
}

export function GET(request: NextRequest) {
  const redirectPath = getGuestRedirectPath(
    getSafeRedirectPath(request.nextUrl.searchParams.get("redirectTo"))
  );
  const redirectUrl = new URL(redirectPath, request.url);
  const url = request.nextUrl.clone();
  url.pathname = redirectUrl.pathname;
  url.search = redirectUrl.search;

  const response = NextResponse.redirect(url);

  response.cookies.set(GUEST_MODE_COOKIE, "1", {
    path: "/",
    sameSite: "lax",
  });
  response.cookies.set(GUEST_ALERT_DISMISSED_COOKIE, "", {
    maxAge: 0,
    path: "/",
    sameSite: "lax",
  });

  return response;
}
