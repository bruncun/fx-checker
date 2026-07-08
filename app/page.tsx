import { buttonVariants } from "@/components/ui/button";
import { Flag } from "@/components/ui/flag";
import { GuestModeLink } from "@/components/guest-mode-link";
import { Icon } from "@/components/ui/icon";
import { Logo } from "@/components/logo";
import { cn } from "@/lib/utils";
import Link from "next/link";

const features = [
  <>
    Live ECB <br className="hidden sm:inline" />
    reference rates
  </>,
  "Compare and save currency pairs",
  <>
    Review recent <br className="hidden sm:inline" />
    conversion history
  </>,
];

const liveRates = [
  { change: "▲ 0.18%", direction: "up", pair: "USD/GBP", rate: "0.7319" },
  { change: "▼ 0.11%", direction: "down", pair: "USD/JPY", rate: "146.72" },
  { change: "▲ 0.07%", direction: "up", pair: "EUR/CAD", rate: "1.6074" },
];

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-neutral-900 text-neutral-50">
      <header className="mx-auto flex w-full max-w-[1180px] items-center justify-between px-200 py-200 sm:px-400 sm:py-300">
        <Logo priority />
        <Link
          className={cn(buttonVariants({ variant: "outline", size: "default" }))}
          href="/auth/login"
        >
          Log in
        </Link>
      </header>

      <section className="mx-auto grid min-h-[calc(100vh-120px)] w-full max-w-[1180px] items-center justify-items-center gap-400 px-200 pt-400 pb-800 sm:gap-500 sm:px-400 lg:grid-cols-[minmax(0,1.5fr)_minmax(380px,.5fr)] lg:justify-items-stretch lg:gap-800 lg:pt-500 lg:pb-1000">
        <div className="max-w-[640px] text-left sm:text-center lg:text-left">
          <p className="mb-200 text-preset-5-medium text-lime-500 uppercase sm:text-preset-4">
            Currency insight, without the clutter
          </p>
          <h1 className="text-[44px] leading-[0.98] font-bold text-neutral-50 sm:text-[48px]">
            Check the rate before money moves.
          </h1>
          <p className="mt-300 max-w-[560px] text-preset-3 leading-[1.5] text-neutral-100 sm:mx-auto sm:text-[18px] lg:mx-0">
            FX Checker keeps live exchange rates, comparisons, favorites, and logged conversions in
            one focused workspace.
          </p>
          <div className="mt-400 flex flex-col gap-150 sm:flex-row sm:justify-center lg:justify-start">
            <Link
              className={cn(
                buttonVariants({ variant: "default", size: "lg" }),
                "w-full sm:w-auto sm:min-w-[208px]"
              )}
              href="/auth/sign-up"
            >
              Get started
            </Link>
            <GuestModeLink className="w-full sm:w-auto sm:min-w-[208px]" size="lg" />
          </div>
          <ul className="mt-300 grid gap-150 text-preset-5-medium text-neutral-100 uppercase sm:grid-cols-3 sm:justify-items-center lg:mb-200 lg:justify-items-start">
            {features.map((feature, index) => (
              <li
                className="flex items-center gap-100 sm:justify-center lg:justify-start"
                key={index}
              >
                <Icon decorative height={16} iconName="check" width={16} />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative mx-auto -mt-100 w-full max-w-[544px] lg:mx-0 lg:mt-0 lg:justify-self-end">
          <div
            aria-label="FX Checker mobile app preview"
            className="mx-auto w-full max-w-[300px] rounded-[32px] bg-[hsl(234_18%_8%)] p-075 shadow-[var(--shadow-elevation-phone)] dark:bg-[hsl(240_3%_13%)]"
            role="img"
          >
            <div className="overflow-hidden rounded-[24px] bg-[hsl(225_36%_97%)] shadow-[inset_0_0_0_1px_hsl(234_24%_22%)] dark:bg-neutral-900 dark:shadow-[inset_0_0_0_1px_hsl(240_3%_18%)]">
              <div className="flex items-center justify-between px-200 pt-150 text-[10px] leading-none text-neutral-100">
                <span>9:41</span>
                <span className="h-075 w-400 rounded-full bg-[hsl(234_30%_5%)] dark:bg-[hsl(240_4%_9%)]" />
                <span>100%</span>
              </div>
              <div className="px-150 pt-200 pb-150">
                <nav className="flex items-center justify-between">
                  <Logo alt="" className="h-200 sm:h-200" priority />
                  <ul className="flex items-center gap-100 text-preset-6 text-neutral-200 uppercase">
                    <li>29 Currencies</li>
                    <li className="text-neutral-400">/</li>
                    <li>ECB</li>
                  </ul>
                </nav>

                <section aria-hidden="true" className="-mx-[11px] mt-200 flex bg-neutral-700">
                  <div className="flex shrink-0 items-center gap-075 bg-lime-500 px-100 py-125 text-preset-6 text-neutral-900 uppercase">
                    <span className="size-[6px] rounded-full bg-neutral-900" />
                    <span>Live markets</span>
                  </div>
                  <div className="min-w-0 flex-1 overflow-hidden">
                    <ul className="flex w-max divide-x divide-neutral-500 border-r border-neutral-500">
                      {liveRates.map((rate) => (
                        <li
                          className="flex shrink-0 items-center gap-100 px-125 py-125 uppercase"
                          key={rate.pair}
                        >
                          <span className="text-preset-6 text-neutral-200">{rate.pair}</span>
                          <span className="text-preset-6 text-neutral-50">{rate.rate}</span>
                          <span
                            className={cn(
                              "text-preset-6",
                              rate.direction === "up" ? "text-green-500" : "text-red-500"
                            )}
                          >
                            {rate.change}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </section>

                <h2 className="mt-250 mb-150 text-preset-3 text-neutral-50 uppercase">
                  Check the Rate
                </h2>

                <div className="rounded-20 bg-neutral-700 shadow-[inset_0_0_0_1px_hsl(226_40%_88%),0_16px_34px_rgb(3_12_58_/_0.17)] dark:shadow-[var(--shadow-elevation-card)]">
                  <div className="grid gap-125 p-150">
                    <section className="rounded-16 bg-[hsl(232_100%_94%)] p-150 shadow-[inset_0_0_0_1px_hsl(229_34%_74%)] dark:bg-neutral-600 dark:shadow-[inset_0_0_0_1px_hsl(var(--neutral-500))]">
                      <h3 className="mb-150 text-preset-4 text-neutral-100 uppercase">Send</h3>
                      <div className="flex items-end justify-between gap-150">
                        <span className="min-w-0 border-b border-[hsl(229_34%_74%)] text-preset-1-tablet text-neutral-50 dark:border-neutral-500">
                          1,000
                        </span>
                        <span className="inline-flex h-500 w-[88px] items-center justify-center gap-075 rounded-8 bg-[hsl(226_48%_86%)] p-125 text-preset-5-medium text-neutral-50 uppercase shadow-[inset_0_0_0_1px_hsl(229_24%_63%)] dark:bg-neutral-500 dark:shadow-[inset_0_0_0_1px_hsl(var(--neutral-400))]">
                          <Flag alt="" className="size-200" countryCode="us" />
                          <span>USD</span>
                          <Icon decorative height={14} iconName="chevron-down" width={14} />
                        </span>
                      </div>
                    </section>

                    <div className="flex justify-center">
                      <div className="flex size-[44px] items-center justify-center rounded-8 bg-[hsl(226_48%_86%)] shadow-[inset_0_0_0_1px_hsl(229_24%_63%)] dark:bg-neutral-500 dark:shadow-[inset_0_0_0_1px_hsl(var(--neutral-400))]">
                        <Icon decorative iconName="exchange-vertical" />
                      </div>
                    </div>

                    <section className="rounded-16 bg-[hsl(232_100%_94%)] p-150 shadow-[inset_0_0_0_1px_hsl(229_34%_74%)] dark:bg-neutral-600 dark:shadow-[inset_0_0_0_1px_hsl(var(--neutral-500))]">
                      <h3 className="mb-150 text-preset-4 text-neutral-100 uppercase">Receive</h3>
                      <div className="flex items-end justify-between gap-150">
                        <span className="min-w-0 border-b border-[hsl(229_34%_74%)] text-preset-1-tablet text-lime-500 dark:border-neutral-500">
                          854
                        </span>
                        <span className="inline-flex h-500 w-[88px] items-center justify-center gap-075 rounded-8 bg-[hsl(226_48%_86%)] p-125 text-preset-5-medium text-neutral-50 uppercase shadow-[inset_0_0_0_1px_hsl(229_24%_63%)] dark:bg-neutral-500 dark:shadow-[inset_0_0_0_1px_hsl(var(--neutral-400))]">
                          <Flag alt="" className="size-200" countryCode="eu" />
                          <span>EUR</span>
                          <Icon decorative height={14} iconName="chevron-down" width={14} />
                        </span>
                      </div>
                    </section>
                  </div>

                  <svg width="100%" height="1">
                    <line
                      x1="0"
                      y1="0"
                      x2="100%"
                      y2="0"
                      className="stroke-neutral-500"
                      strokeWidth="1"
                      strokeDasharray="4 4"
                    />
                  </svg>

                  <div className="p-150">
                    <p className="text-center text-preset-6 text-neutral-50">1 USD = 0.8540 EUR</p>
                    <div className="mt-150 flex justify-center gap-100">
                      <span
                        aria-hidden="true"
                        className="inline-flex size-400 items-center justify-center rounded-8 bg-[hsl(226_48%_86%)] shadow-[inset_0_0_0_1px_hsl(229_24%_63%)] dark:bg-neutral-500 dark:shadow-[inset_0_0_0_1px_hsl(var(--neutral-400))]"
                      >
                        <Icon className="fx-favorite-unpinned" decorative iconName="star" />
                      </span>
                      <span
                        aria-hidden="true"
                        className="inline-flex h-400 items-center justify-center rounded-8 bg-transparent px-150 py-100 text-preset-5-medium text-neutral-50 uppercase shadow-[inset_0_0_0_1px_hsl(var(--lime-500))]"
                      >
                        Log conversion
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
