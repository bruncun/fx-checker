import { Header } from "@/features/header";
import type { ReactNode } from "react";

type HomePageContentProps = {
  converterSlot: ReactNode;
  headerStatsSlot: ReactNode;
  liveRatesSlot: ReactNode;
  rateDetailsSlot: ReactNode;
};

export function HomePageContent({
  converterSlot,
  headerStatsSlot,
  liveRatesSlot,
  rateDetailsSlot,
}: HomePageContentProps) {
  return (
    <main className="text-white min-h-screen bg-neutral-900">
      <Header statsSlot={headerStatsSlot} />
      {liveRatesSlot}
      <div className="mx-auto max-w-[1100px] px-200 py-400 sm:px-300 sm:py-600 lg:px-400">
        {converterSlot}
        <div className="mt-500 lg:mt-400">{rateDetailsSlot}</div>
      </div>
    </main>
  );
}
