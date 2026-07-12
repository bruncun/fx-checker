import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "FX Checker",
    short_name: "FX Checker",
    description:
      "Check daily foreign exchange rates, compare currencies, and track favorite conversions.",
    start_url: "/",
    display: "standalone",
    background_color: "#050a2f",
    theme_color: "#050a2f",
    icons: [
      {
        src: "/images/app-icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/images/app-icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/images/app-icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
