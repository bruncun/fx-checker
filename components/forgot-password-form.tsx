"use client";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useState } from "react";

export function ForgotPasswordForm({ className, ...props }: React.ComponentPropsWithoutRef<"div">) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    try {
      // The url which will be included in the email. This URL needs to be configured in your redirect URLs in the Supabase dashboard at https://supabase.com/dashboard/project/_/auth/url-configuration
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/update-password`,
      });
      if (error) throw error;
      setSuccess(true);
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col", className)} {...props}>
      {success ? (
        <>
          <CardTitle>Check Your Email</CardTitle>
          <Card>
            <CardContent>
              <p className="text-center text-preset-4 text-neutral-200">
                If you registered using your email and password, you will receive a password reset
                email.
              </p>
            </CardContent>
          </Card>
        </>
      ) : (
        <>
          <CardTitle>Reset Your Password</CardTitle>
          <Card>
            <CardContent>
              <form onSubmit={handleForgotPassword}>
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
