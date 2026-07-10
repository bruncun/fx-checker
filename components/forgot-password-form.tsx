"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useState } from "react";

type AuthActionState = {
  error: string | null;
  success?: boolean;
};

export function ForgotPasswordForm({ className, ...props }: React.ComponentPropsWithoutRef<"div">) {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    const response = await fetch("/auth/forgot-password/action", {
      body: new FormData(event.currentTarget),
      method: "POST",
    });
    const state = (await response.json()) as AuthActionState;

    setError(state.error);
    setSuccess(Boolean(state.success));
    setIsLoading(false);
  }

  return (
    <div className={cn("flex flex-col", className)} {...props}>
      {success ? (
        <>
          <CardTitle>Check Your Email</CardTitle>
          <p className="text-preset-3-mobile text-center text-neutral-200">
            If you registered using your email and password, you will receive a password reset
            email.
          </p>
        </>
      ) : (
        <>
          <CardTitle>Reset Your Password</CardTitle>
          <Card>
            <CardContent>
              <form onSubmit={handleSubmit}>
                <div className="flex flex-col gap-250">
                  <div className="flex flex-col gap-100">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
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
                Already have an account?{" "}
                <Link
                  href="/auth/login"
                  className="rounded-4 text-neutral-50 underline underline-offset-4 hover:decoration-neutral-200 focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-lime-500"
                >
                  Login
                </Link>
              </p>
            </CardFooter>
          </Card>
        </>
      )}
    </div>
  );
}
