import { AuthShell } from "@/components/auth-shell";
import { SignUpForm } from "@/components/sign-up-form";
import { UnauthOnlyRoute } from "@/components/unauth-only-route";

export default function Page() {
  return (
    <AuthShell>
      <UnauthOnlyRoute />
      <SignUpForm />
    </AuthShell>
  );
}
