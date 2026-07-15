import { AuthModal } from "@/components/auth-modal";
import { ForgotPasswordSent } from "@/components/forgot-password-sent";

export default function Page() {
  return (
    <AuthModal title="Check Your Email">
      <ForgotPasswordSent layout="modal" />
    </AuthModal>
  );
}
