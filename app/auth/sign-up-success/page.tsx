import { AuthShell } from "@/components/auth-shell";
import { Card, CardContent, CardTitle } from "@/components/ui/card";

export default function Page() {
  return (
    <AuthShell>
      <div className="flex flex-col">
        <CardTitle>Thank you for signing up!</CardTitle>
        <Card>
          <CardContent>
            <p className="text-center text-preset-4 text-neutral-200">
              You&apos;ve successfully signed up. Please check your email to confirm your account
              before signing in.
            </p>
          </CardContent>
        </Card>
      </div>
    </AuthShell>
  );
}
