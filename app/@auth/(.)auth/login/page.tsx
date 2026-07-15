import { AuthModal } from "@/components/auth-modal";
import { LoginForm } from "@/components/login-form";
import { Suspense } from "react";

export default function Page() {
  return (
    <AuthModal title="Login">
      <Suspense>
        <LoginForm layout="modal" />
      </Suspense>
    </AuthModal>
  );
}
