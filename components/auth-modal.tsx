"use client";

import { AppModal } from "@/components/ui/app-modal";
import { useRouter } from "next/navigation";

type AuthModalProps = {
  children: React.ReactNode;
  title: string;
};

export function AuthModal({ children, title }: AuthModalProps) {
  const router = useRouter();

  return (
    <AppModal
      closeLabel={`Close ${title.toLocaleLowerCase()}`}
      onClose={() => {
        router.replace("/");
      }}
      title={title}
    >
      {children}
    </AppModal>
  );
}
