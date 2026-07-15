import { adoptGuestSessionData } from "@/features/guest-session/api/adoption";
import { createClient } from "@/lib/supabase/server";
import { headers } from "next/headers";

export type AuthActionState = {
  error: string | null;
  redirectTo?: string;
  success?: boolean;
};

function getSafeRedirectPath(redirectTo: string | null) {
  if (!redirectTo?.startsWith("/") || redirectTo.startsWith("//")) {
    return "/";
  }

  if (redirectTo.startsWith("/app?")) {
    return `/${redirectTo.slice("/app".length)}`;
  }

  if (redirectTo === "/app") {
    return "/";
  }

  return redirectTo;
}

async function getOrigin() {
  const configuredOrigin = process.env.APP_ORIGIN?.trim();

  if (configuredOrigin) {
    try {
      const url = new URL(configuredOrigin);

      return url.origin;
    } catch {
      if (process.env.NODE_ENV === "production") {
        throw new Error("APP_ORIGIN must be a valid URL");
      }
    }
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("APP_ORIGIN is required in production");
  }

  const headerStore = await headers();
  const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host");
  const protocol = headerStore.get("x-forwarded-proto") ?? "http";

  return host ? `${protocol}://${host}` : "";
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
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      throw error;
    }

    if (data.user) {
      await adoptGuestSessionData({ supabase, userId: data.user.id });
    }

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
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: await getOrigin(),
      },
    });

    if (error) {
      throw error;
    }

    if (data.session && data.user) {
      await adoptGuestSessionData({ supabase, userId: data.user.id });
      return { error: null, redirectTo: "/" };
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

    return { error: null, redirectTo: "/" };
  } catch (error) {
    return { error: getErrorMessage(error) };
  }
}
