"use client";

import { useRouter } from "next/navigation";

import { ForgotPasswordForm } from "./forgot-password-form";

export function ForgotPasswordModalForm() {
  const router = useRouter();

  return (
    <ForgotPasswordForm
      layout="modal"
      navigate={(href) => {
        router.replace(href);
      }}
    />
  );
}
