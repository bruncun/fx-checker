import { HomePageShell } from "@/features/home";
import type { ReactNode } from "react";

type HomeRouteGroupLayoutProps = {
  children: ReactNode;
};

export default function HomeRouteGroupLayout({ children }: HomeRouteGroupLayoutProps) {
  return <HomePageShell>{children}</HomePageShell>;
}
