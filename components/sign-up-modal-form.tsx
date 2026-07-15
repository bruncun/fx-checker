"use client";

import { useRouter } from "next/navigation";

import { SignUpForm } from "./sign-up-form";

export function SignUpModalForm() {
  const router = useRouter();

  return (
    <SignUpForm
      layout="modal"
      navigate={(href) => {
        if (href === "/") {
          // Auth mutates cookies in a fetch response; use document navigation
          // so the app shell renders from the updated session immediately,
          // and replace so Back cannot reopen stale authenticated-only auth state.
          window.location.replace(href);
          return;
        }

        router.replace(href);
      }}
    />
  );
}
