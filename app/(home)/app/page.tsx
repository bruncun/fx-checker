import { HomeRoute, type HomeRouteProps } from "@/features/home/home-route";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default function Home(props: HomeRouteProps) {
  return <HomeRoute {...props} />;
}
