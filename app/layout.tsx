import type { Metadata, Viewport } from "next";
import { JetBrains_Mono } from "next/font/google";
import { ThemeProvider } from "next-themes";

import { IOSViewport } from "@/components/ios-viewport";
import "./globals.css";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: {
    default: "FX Checker",
    template: "%s | FX Checker",
  },
  description:
    "Check live foreign exchange rates, compare currencies, and track favorite conversions with FX Checker.",
  icons: {
    icon: [
      {
        url: "/images/favicon.svg",
        type: "image/svg+xml",
        sizes: "any",
      },
      {
        url: "/images/favicon-32x32.png",
        type: "image/png",
        sizes: "32x32",
      },
    ],
    shortcut: [
      {
        url: "/images/favicon-32x32.png",
        type: "image/png",
        sizes: "32x32",
      },
    ],
    apple: [
      {
        url: "/images/apple-touch-icon.png",
        type: "image/png",
        sizes: "180x180",
      },
    ],
  },
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

const jetBrainsMono = JetBrains_Mono({
  weight: ["400", "500", "700"],
  display: "swap",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${jetBrainsMono.className} antialiased`}>
        <IOSViewport />
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
