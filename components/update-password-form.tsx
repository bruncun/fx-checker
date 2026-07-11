"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

type AuthActionState = {
  error: string | null;
  redirectTo?: string;
};

export function UpdatePasswordForm({ className, ...props }: React.ComponentPropsWithoutRef<"div">) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const resetFormState = useCallback(() => {
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

    const response = await fetch("/auth/update-password/action", {
      body: new FormData(event.currentTarget),
      method: "POST",
    });
    const state = (await response.json()) as AuthActionState;

    if (state.redirectTo) {
      router.push(state.redirectTo);
      return;
    }

    setError(state.error);
    setIsLoading(false);
  }

  return (
    <div className={cn("flex flex-col", className)} {...props}>
      <CardTitle>Reset Your Password</CardTitle>
      <Card>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="flex flex-col gap-250">
              <div className="flex flex-col gap-100">
                <Label htmlFor="password">New password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="New password"
                  required
                />
              </div>
              {error && <p className="text-preset-5-medium text-red-500">{error}</p>}
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Saving..." : "Save new password"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
