import { HomePageShell } from "@/features/home";
import { HomeRoute, type HomeRouteProps } from "@/features/home/home-route";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default function Page(props: HomeRouteProps) {
  return (
    <HomePageShell>
      <HomeRoute {...props} />
    </HomePageShell>
  );
}
