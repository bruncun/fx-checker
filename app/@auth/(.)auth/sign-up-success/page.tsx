import { AuthModal } from "@/components/auth-modal";
import { SignUpSuccess } from "@/components/sign-up-success";

export default function Page() {
  return (
    <AuthModal title="Thank you for signing up!">
      <SignUpSuccess layout="modal" />
    </AuthModal>
  );
}
