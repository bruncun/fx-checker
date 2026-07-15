import { AuthModal } from "@/components/auth-modal";
import { SignUpModalForm } from "@/components/sign-up-modal-form";

export default function Page() {
  return (
    <AuthModal title="Sign up">
      <SignUpModalForm />
    </AuthModal>
  );
}
