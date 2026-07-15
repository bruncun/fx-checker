"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

type AuthActionState = {
  error: string | null;
  redirectTo?: string;
};

type LoginFormProps = React.ComponentPropsWithoutRef<"div"> & {
  navigate?: (href: string) => void;
};

export function getSafeRedirectPath(redirectTo: string | null) {
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

export function LoginForm({
  className,
  // Auth mutates cookies in a fetch response; use a document navigation so the
  // app shell is rendered from the updated session rather than cached guest UI.
  // eslint-disable-next-line @next/next/no-location-assign-relative-destination
  navigate = (href) => window.location.assign(new URL(href, window.location.href)),
  ...props
}: LoginFormProps) {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const redirectPath = getSafeRedirectPath(searchParams.get("redirectTo"));

  const resetFormState = useCallback(() => {
    setEmail("");
    setPassword("");
    setError(null);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    window.addEventListener("pageshow", resetFormState);

    return () => {
      window.removeEventListener("pageshow", resetFormState);
      resetFormState();
    };
  }, [resetFormState]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    const response = await fetch("/auth/login/action", {
      body: new FormData(event.currentTarget),
      method: "POST",
    });
    const state = (await response.json()) as AuthActionState;

    if (state.redirectTo) {
      navigate(state.redirectTo);
      return;
    }

    setError(state.error);
    setIsLoading(false);
  }

  return (
    <div className={cn("flex flex-col", className)} {...props}>
      <CardTitle>Login</CardTitle>
      <Card>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <input name="redirectTo" type="hidden" value={redirectPath} />
            <div className="flex flex-col gap-250">
              <div className="flex flex-col gap-100">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="m@example.com"
                  required
                />
              </div>
              <div className="flex flex-col gap-100">
                <div className="flex items-center justify-between pe-100">
                  <Label htmlFor="password">Password</Label>
                  <Link
                    href="/auth/forgot-password"
                    className="ml-auto inline-block rounded-4 text-preset-5-medium text-neutral-50 underline-offset-4 hover:underline hover:decoration-neutral-200 focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-lime-500"
                  >
                    Forgot your password?
                  </Link>
                </div>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
              </div>
              {error && <p className="text-preset-5-medium text-red-500">{error}</p>}
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Logging in..." : "Login"}
              </Button>
            </div>
          </form>
        </CardContent>
        <svg width="100%" height="1">
          <line
            x1="0"
            y1="0"
            x2="100%"
            y2="0"
            className="stroke-neutral-500"
            strokeWidth="1"
            strokeDasharray="4 4"
          />
        </svg>
        <CardFooter>
          <p className="w-full text-center text-preset-5-medium text-neutral-200">
            Don&apos;t have an account?{" "}
            <Link
              href="/auth/sign-up"
              className="rounded-4 text-neutral-50 underline-offset-4 hover:underline hover:decoration-neutral-200 focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-lime-500"
            >
              Sign up
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
