"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardTitle } from "@/components/ui/card";
import { FullPageAuthLink } from "@/components/full-page-auth-link";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type AuthActionState = {
  error: string | null;
  success?: boolean;
};

type ForgotPasswordFormProps = React.ComponentPropsWithoutRef<"div"> & {
  layout?: "modal" | "page";
  navigate?: (href: string) => void;
};

export function ForgotPasswordForm({
  className,
  layout = "page",
  navigate = (href) => {
    // Standalone auth pages use document navigation after mutation responses.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.assign(href);
  },
  ...props
}: ForgotPasswordFormProps) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const resetFormState = useCallback(() => {
    setEmail("");
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

    const response = await fetch("/auth/forgot-password/action", {
      body: new FormData(event.currentTarget),
      method: "POST",
    });
    const state = (await response.json()) as AuthActionState;

    if (state.success) {
      navigate("/auth/forgot-password/sent");
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
        {error && <p className="text-preset-5-medium text-red-500">{error}</p>}
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Sending..." : "Send reset email"}
        </Button>
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
      <CardTitle>Reset Your Password</CardTitle>
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
