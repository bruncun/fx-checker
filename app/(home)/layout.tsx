import { HomePageShell } from "@/features/home";
import { RateDetails } from "@/features/rate-details";
import { Suspense, type ReactNode } from "react";

type HomeRouteGroupLayoutProps = {
  children: ReactNode;
};

export default function HomeRouteGroupLayout({ children }: HomeRouteGroupLayoutProps) {
  return (
    <Suspense fallback={<main className="text-white min-h-screen bg-neutral-900" />}>
      <HomePageShell>
        <RateDetails>{children}</RateDetails>
      </HomePageShell>
    </Suspense>
  );
}
