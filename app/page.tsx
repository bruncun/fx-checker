import { HomePage } from "@/features/home";
import { Suspense } from "react";

export default function Home() {
  return (
    <Suspense fallback={<main className="text-white min-h-screen bg-neutral-900" />}>
      <HomePage />
    </Suspense>
  );
}
