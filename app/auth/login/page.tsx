import { AuthShell } from "@/components/auth-shell";
import { LoginForm } from "@/components/login-form";
import { UnauthOnlyRoute } from "@/components/unauth-only-route";
import { Suspense } from "react";

export default function Page() {
  return (
    <AuthShell>
      <UnauthOnlyRoute />
      <Suspense>
        <LoginForm />
      </Suspense>
    </AuthShell>
  );
}
