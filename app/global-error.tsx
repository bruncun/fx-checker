"use client";

import { DataUnavailableContent } from "@/features/home/components/data-unavailable";

export default function GlobalError() {
  return (
    <html lang="en">
      <body>
        <main className="text-white min-h-screen bg-neutral-900">
          <DataUnavailableContent />
        </main>
      </body>
    </html>
  );
}
