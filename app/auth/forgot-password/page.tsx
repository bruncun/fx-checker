import { AuthShell } from "@/components/auth-shell";
import { ForgotPasswordForm } from "@/components/forgot-password-form";
import { UnauthOnlyRoute } from "@/components/unauth-only-route";

export default function Page() {
  return (
    <AuthShell>
      <UnauthOnlyRoute />
      <ForgotPasswordForm />
    </AuthShell>
  );
}
