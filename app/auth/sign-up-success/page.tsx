import { AuthShell } from "@/components/auth-shell";
import { CardTitle } from "@/components/ui/card";

export default function Page() {
  return (
    <AuthShell>
      <div className="flex flex-col">
        <CardTitle>Thank you for signing up!</CardTitle>
        <p className="text-preset-3-mobile text-center text-neutral-200">
          You&apos;ve successfully signed up. Please check your email to confirm your account before
          signing in.
        </p>
      </div>
    </AuthShell>
  );
}
