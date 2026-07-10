import {
  GUEST_ALERT_DISMISSED_COOKIE,
  GUEST_CONVERSIONS_COOKIE,
  GUEST_FAVORITES_COOKIE,
  GUEST_MODE_COOKIE,
} from "@/features/guest-session/guest-session";
import { createClient } from "@/lib/supabase/server";
import { cookies, headers } from "next/headers";

export type AuthActionState = {
  error: string | null;
  redirectTo?: string;
  success?: boolean;
};

const guestSessionCookies = [
  GUEST_MODE_COOKIE,
  GUEST_FAVORITES_COOKIE,
  GUEST_CONVERSIONS_COOKIE,
  GUEST_ALERT_DISMISSED_COOKIE,
];

function getSafeRedirectPath(redirectTo: string | null) {
  if (!redirectTo?.startsWith("/") || redirectTo.startsWith("//")) {
    return "/app";
  }

  return redirectTo;
}

async function getOrigin() {
  const headerStore = await headers();
  const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host");
  const protocol = headerStore.get("x-forwarded-proto") ?? "http";

  return host ? `${protocol}://${host}` : "";
}

async function clearGuestSessionCookies() {
  const cookieStore = await cookies();

  guestSessionCookies.forEach((name) => {
    cookieStore.set(name, "", {
      maxAge: 0,
      path: "/",
      sameSite: "lax",
    });
  });
}

function getString(formData: FormData, name: string) {
  const value = formData.get(name);

  return typeof value === "string" ? value : "";
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "An error occurred";
}

export async function loginAction(
  _previousState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const email = getString(formData, "email");
  const password = getString(formData, "password");
  const redirectTo = getSafeRedirectPath(getString(formData, "redirectTo"));

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      throw error;
    }

    await clearGuestSessionCookies();

    return { error: null, redirectTo };
  } catch (error) {
    return { error: getErrorMessage(error) };
  }
}

export async function signUpAction(
  _previousState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const email = getString(formData, "email");
  const password = getString(formData, "password");
  const repeatPassword = getString(formData, "repeatPassword");

  if (password !== repeatPassword) {
    return { error: "Passwords do not match" };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: await getOrigin(),
      },
    });

    if (error) {
      throw error;
    }

    return { error: null, redirectTo: "/auth/sign-up-success" };
  } catch (error) {
    return { error: getErrorMessage(error) };
  }
}

export async function forgotPasswordAction(
  _previousState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const email = getString(formData, "email");

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${await getOrigin()}/auth/update-password`,
    });

    if (error) {
      throw error;
    }

    return { error: null, success: true };
  } catch (error) {
    return { error: getErrorMessage(error) };
  }
}

export async function updatePasswordAction(
  _previousState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const password = getString(formData, "password");

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      throw error;
    }

    return { error: null, redirectTo: "/app" };
  } catch (error) {
    return { error: getErrorMessage(error) };
  }
}
