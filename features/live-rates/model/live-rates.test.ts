import { describe, expect, it } from "vitest";

import type { FrankfurterRate } from "@/lib/frankfurter";
import { deriveLiveRates } from "./live-rates";

const latestRates: FrankfurterRate[] = [
  { date: "2026-06-19", base: "EUR", quote: "USD", rate: 1.171 },
  { date: "2026-06-19", base: "EUR", quote: "GBP", rate: 0.85 },
  { date: "2026-06-19", base: "EUR", quote: "JPY", rate: 183.24 },
  { date: "2026-06-19", base: "EUR", quote: "CHF", rate: 0.94 },
  { date: "2026-06-19", base: "EUR", quote: "AUD", rate: 1.79 },
  { date: "2026-06-19", base: "EUR", quote: "CAD", rate: 1.6 },
];

const historicalRates: FrankfurterRate[] = [
  { date: "2026-06-12", base: "EUR", quote: "USD", rate: 1.168 },
  { date: "2026-06-12", base: "EUR", quote: "GBP", rate: 0.852 },
  { date: "2026-06-12", base: "EUR", quote: "JPY", rate: 182.12 },
  { date: "2026-06-12", base: "EUR", quote: "CHF", rate: 0.95 },
  { date: "2026-06-12", base: "EUR", quote: "AUD", rate: 1.8 },
  { date: "2026-06-12", base: "EUR", quote: "CAD", rate: 1.61 },
  { date: "2026-06-18", base: "EUR", quote: "USD", rate: 1.1723 },
  { date: "2026-06-18", base: "EUR", quote: "GBP", rate: 0.8533 },
  { date: "2026-06-18", base: "EUR", quote: "JPY", rate: 183.8 },
  { date: "2026-06-18", base: "EUR", quote: "CHF", rate: 0.939 },
  { date: "2026-06-18", base: "EUR", quote: "AUD", rate: 1.785 },
  { date: "2026-06-18", base: "EUR", quote: "CAD", rate: 1.59 },
];

describe("live rate derivation", () => {
  it("derives ticker rates and changes from the earliest lookback date", () => {
    expect(deriveLiveRates({ historicalRates, latestRates })).toEqual([
      { pair: "EUR/USD", rate: "1.1710", change: "+0.26%", direction: "up" },
      { pair: "USD/JPY", rate: "156.48", change: "+0.36%", direction: "up" },
      { pair: "GBP/USD", rate: "1.3776", change: "+0.49%", direction: "up" },
      { pair: "USD/CHF", rate: "0.8027", change: "-1.31%", direction: "down" },
      { pair: "EUR/GBP", rate: "0.8500", change: "-0.23%", direction: "down" },
      { pair: "AUD/USD", rate: "0.6542", change: "+0.82%", direction: "up" },
      { pair: "USD/CAD", rate: "1.3664", change: "-0.88%", direction: "down" },
    ]);
  });

  it("returns no live rates without a previous historical date", () => {
    expect(deriveLiveRates({ historicalRates: latestRates, latestRates })).toEqual([]);
  });

  it("marks unchanged rounded rates as neutral", () => {
    expect(
      deriveLiveRates({
        historicalRates: latestRates.map((rate) => ({ ...rate, date: "2026-06-18" })),
        latestRates,
      })[0]
    ).toEqual({ pair: "EUR/USD", rate: "1.1710", change: "0.00%", direction: "neutral" });
  });
});
