"use client";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  GUEST_ALERT_DISMISSED_COOKIE,
  GUEST_CONVERSIONS_COOKIE,
  GUEST_FAVORITES_COOKIE,
  GUEST_MODE_COOKIE,
} from "@/features/guest-session/guest-session";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export function getSafeRedirectPath(redirectTo: string | null) {
  if (!redirectTo?.startsWith("/") || redirectTo.startsWith("//")) {
    return "/app";
  }

  return redirectTo;
}

function clearGuestSessionCookies() {
  document.cookie = `${GUEST_MODE_COOKIE}=; Path=/; SameSite=Lax; Max-Age=0`;
  document.cookie = `${GUEST_FAVORITES_COOKIE}=; Path=/; SameSite=Lax; Max-Age=0`;
  document.cookie = `${GUEST_CONVERSIONS_COOKIE}=; Path=/; SameSite=Lax; Max-Age=0`;
  document.cookie = `${GUEST_ALERT_DISMISSED_COOKIE}=; Path=/; SameSite=Lax; Max-Age=0`;
}

export function LoginForm({ className, ...props }: React.ComponentPropsWithoutRef<"div">) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  const redirectPath = getSafeRedirectPath(searchParams.get("redirectTo"));

  useEffect(() => {
    return () => {
      setEmail("");
      setPassword("");
      setError(null);
      setIsLoading(false);
    };
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      clearGuestSessionCookies();
      router.push(redirectPath);
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred");
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col", className)} {...props}>
      <CardTitle>Login</CardTitle>
      <Card>
        <CardContent>
          <form onSubmit={handleLogin}>
            <div className="flex flex-col gap-250">
              <div className="flex flex-col gap-100">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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
