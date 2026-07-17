import { HomeRoute, type HomeRouteProps } from "@/features/home/home-route";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard",
};

export const instant = false;

export default function Page(props: HomeRouteProps) {
  return <HomeRoute {...props} />;
}
