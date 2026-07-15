import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { hasEnvVars } from "../utils";
import {
  GUEST_MODE_COOKIE,
  isGuestCookieValue,
} from "@/features/guest-session/model/guest-session";

const publicRoutes = new Set(["/guest"]);
const unauthOnlyRoutes = new Set([
  "/auth/forgot-password",
  "/auth/login",
  "/auth/sign-up",
  "/auth/sign-up-success",
]);

function redirectToApp(
  request: NextRequest,
  responseToCopy?: NextResponse,
  { preserveSearch = false }: { preserveSearch?: boolean } = {}
) {
  const url = request.nextUrl.clone();
  url.pathname = "/";
  if (!preserveSearch) {
    url.search = "";
  }

  const response = NextResponse.redirect(url);

  responseToCopy?.cookies.getAll().forEach((cookie) => {
    response.cookies.set(cookie);
  });

  return response;
}

function redirectToRoot(request: NextRequest, responseToCopy?: NextResponse) {
  const url = request.nextUrl.clone();
  url.pathname = "/";

  const response = NextResponse.redirect(url);

  responseToCopy?.cookies.getAll().forEach((cookie) => {
    response.cookies.set(cookie);
  });

  return response;
}

function startGuestSession(request: NextRequest, responseToCopy?: NextResponse) {
  const response = NextResponse.redirect(request.nextUrl);

  responseToCopy?.cookies.getAll().forEach((cookie) => {
    response.cookies.set(cookie);
  });

  response.cookies.set(GUEST_MODE_COOKIE, "1", {
    path: "/",
    sameSite: "lax",
  });

  return response;
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });
  const pathname = request.nextUrl.pathname;

  // If the env vars are not set, skip proxy check. You can remove this
  // once you setup the project.
  if (!hasEnvVars) {
    return supabaseResponse;
  }

  if (process.env.FX_CHECKER_E2E_AUTH_BYPASS === "1") {
    return supabaseResponse;
  }

  if (pathname === "/app") {
    return redirectToRoot(request, supabaseResponse);
  }

  if (publicRoutes.has(pathname)) {
    return supabaseResponse;
  }

  const isGuestMode = isGuestCookieValue(request.cookies.get(GUEST_MODE_COOKIE)?.value);

  if (isGuestMode && !pathname.startsWith("/auth")) {
    return supabaseResponse;
  }

  // With Fluid compute, don't put this client in a global environment
  // variable. Always create a new one on each request.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Do not run code between createServerClient and
  // supabase.auth.getClaims(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  // IMPORTANT: If you remove getClaims() and you use server-side rendering
  // with the Supabase client, your users may be randomly logged out.
  const { data } = await supabase.auth.getClaims();
  const user = data?.claims;

  if (user && unauthOnlyRoutes.has(pathname)) {
    return redirectToApp(request, supabaseResponse);
  }

  if (!user && pathname === "/") {
    return startGuestSession(request, supabaseResponse);
  }

  if (!user && !pathname.startsWith("/auth")) {
    // no user, potentially respond by redirecting the user to the login page
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    url.searchParams.set("redirectTo", `${pathname}${request.nextUrl.search}`);
    return NextResponse.redirect(url);
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is.
  // If you're creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely!

  return supabaseResponse;
}
