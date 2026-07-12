import { Header } from "@/features/header";
import { KeyboardShortcutsProvider } from "@/features/keyboard-shortcuts";
import { Suspense, type ReactNode } from "react";
import { GuestModeAlert } from "./guest-mode-alert";

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
    <KeyboardShortcutsProvider>
      <div className="text-white min-h-screen bg-neutral-900">
        <a
          className="sr-only z-[100] rounded-4 rounded-8 bg-neutral-900 px-150 py-100 text-preset-5-medium text-preset-6 text-neutral-50 uppercase underline-offset-4 shadow-[0_0_0_3px_hsl(var(--neutral-900)),0_0_0_5px_hsl(var(--lime-500))] hover:underline hover:decoration-neutral-200 focus:not-sr-only focus:absolute focus:top-200 focus:left-200 focus:outline-none focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-lime-500 sm:text-preset-4"
          href="#converter"
        >
          Go to main content
        </a>
        <Header statsSlot={headerStatsSlot} />
        {liveRatesSlot}
        <main>
          <div className="mx-auto max-w-[1100px] px-200 py-400 sm:px-300 sm:py-600 lg:px-400">
            <Suspense fallback={null}>
              <GuestModeAlert />
            </Suspense>
            <section
              aria-label="Converter"
              className="relative z-[30] scroll-mt-200 focus:outline-none"
              id="converter"
              tabIndex={-1}
            >
              <h1 id="converter-heading" className="mb-200 text-preset-2 text-neutral-50 uppercase">
                Check the Rate
              </h1>
              {converterSlot}
            </section>
            <div className="mt-500 lg:mt-400">{rateDetailsSlot}</div>
          </div>
        </main>
      </div>
    </KeyboardShortcutsProvider>
  );
}
