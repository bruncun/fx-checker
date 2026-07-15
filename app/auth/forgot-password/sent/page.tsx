import { AuthShell } from "@/components/auth-shell";
import { ForgotPasswordSent } from "@/components/forgot-password-sent";
import { UnauthOnlyRoute } from "@/components/unauth-only-route";

export default function Page() {
  return (
    <AuthShell>
      <UnauthOnlyRoute />
      <ForgotPasswordSent />
    </AuthShell>
  );
}
