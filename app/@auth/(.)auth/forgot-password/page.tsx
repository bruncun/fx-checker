import { AuthModal } from "@/components/auth-modal";
import { ForgotPasswordModalForm } from "@/components/forgot-password-modal-form";

export default function Page() {
  return (
    <AuthModal title="Reset Your Password">
      <ForgotPasswordModalForm />
    </AuthModal>
  );
}
