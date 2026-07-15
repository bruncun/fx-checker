"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardTitle } from "@/components/ui/card";
import { FullPageAuthLink } from "@/components/full-page-auth-link";
import { GuestModeLink } from "@/components/guest-mode-link";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type AuthActionState = {
  error: string | null;
  redirectTo?: string;
};

type SignUpFormProps = React.ComponentPropsWithoutRef<"div"> & {
  layout?: "modal" | "page";
  navigate?: (href: string) => void;
};

function replaceWithDocumentNavigation(href: string) {
  window.location.replace(new URL(href, window.location.href));
}

export function SignUpForm({
  className,
  layout = "page",
  // Auth can mutate cookies in a fetch response; use a document navigation so
  // account state is reflected immediately when signup returns an active session,
  // and replace so Back cannot reopen stale authenticated-only auth state.
  navigate = replaceWithDocumentNavigation,
  ...props
}: SignUpFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const resetFormState = useCallback(() => {
    setEmail("");
    setPassword("");
    setRepeatPassword("");
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

    const response = await fetch("/auth/sign-up/action", {
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

  const form = (
    <form onSubmit={handleSubmit}>
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
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </div>
        <div className="flex flex-col gap-100">
          <Label htmlFor="repeat-password">Repeat Password</Label>
          <Input
            id="repeat-password"
            name="repeatPassword"
            type="password"
            value={repeatPassword}
            onChange={(event) => setRepeatPassword(event.target.value)}
            required
          />
        </div>
        {error && <p className="text-preset-5-medium text-red-500">{error}</p>}
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Creating an account..." : "Sign up"}
        </Button>
        {layout === "page" ? <GuestModeLink /> : null}
      </div>
    </form>
  );
  const footer = (
    <p className="w-full text-center text-preset-5 text-neutral-200">
      Already have an account?{" "}
      {layout === "modal" ? (
        <Link
          href="/auth/login"
          className="rounded-4 text-preset-5-medium text-neutral-50 underline-offset-4 hover:decoration-neutral-200 focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-lime-500"
          replace
        >
          Login
        </Link>
      ) : (
        <FullPageAuthLink
          href="/auth/login"
          className="rounded-4 text-preset-5-medium text-neutral-50 underline-offset-4 hover:decoration-neutral-200 focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-lime-500"
        >
          Login
        </FullPageAuthLink>
      )}
    </p>
  );

  if (layout === "modal") {
    return (
      <div className={cn("mt-300 flex flex-col gap-250", className)} {...props}>
        {form}
        {footer}
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col", className)} {...props}>
      <CardTitle>Sign up</CardTitle>
      <Card>
        <CardContent>{form}</CardContent>
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
        <CardFooter>{footer}</CardFooter>
      </Card>
    </div>
  );
}
