import { describe, expect, it } from "vitest";

import type { FrankfurterRate } from "@/lib/frankfurter";
import {
  deriveRateHistoryData,
  getDateYearsBefore,
  getRateHistoryRangePoints,
  getRateHistoryStats,
} from "../model/rate-history";

const rates: FrankfurterRate[] = [
  { date: "2026-05-18", base: "EUR", quote: "GBP", rate: 0.9 },
  { date: "2026-05-18", base: "EUR", quote: "USD", rate: 1.2 },
  { date: "2026-05-19", base: "EUR", quote: "GBP", rate: 0.8 },
  { date: "2026-05-19", base: "EUR", quote: "USD", rate: 1.25 },
  { date: "2026-06-12", base: "EUR", quote: "GBP", rate: 0.85 },
  { date: "2026-06-12", base: "EUR", quote: "USD", rate: 1.2 },
  { date: "2026-06-18", base: "EUR", quote: "GBP", rate: 0.84 },
  { date: "2026-06-18", base: "EUR", quote: "USD", rate: 1.25 },
  { date: "2026-06-19", base: "EUR", quote: "GBP", rate: 0.86 },
  { date: "2026-06-19", base: "EUR", quote: "USD", rate: 1.2 },
];

describe("rate history derivation", () => {
  it("derives pair history and range stats from shared-base historical rates", () => {
    const history = deriveRateHistoryData({
      baseCurrency: "USD",
      quoteCurrency: "GBP",
      rates,
    });

    expect(history?.pair).toBe("USD/GBP");
    expect(history?.points.at(-1)).toEqual({
      date: "2026-06-19",
      rate: 0.7166666666666667,
    });
    expect(history ? getRateHistoryRangePoints(history.points, "1D") : []).toEqual([
      { date: "2026-06-18", rate: 0.672 },
      { date: "2026-06-19", rate: 0.7166666666666667 },
    ]);
    expect(history ? getRateHistoryRangePoints(history.points, "1M")[0] : null).toEqual({
      date: "2026-05-19",
      rate: 0.64,
    });
    expect(
      history ? getRateHistoryStats(getRateHistoryRangePoints(history.points, "1D")) : []
    ).toEqual([
      { label: "Open", value: "0.6720" },
      { label: "Last", value: "0.7167" },
      { direction: "up", label: "Change", showIndicator: false, value: "+0.0447" },
      { direction: "up", label: "% Change", showIndicator: true, value: "+6.65%" },
    ]);
  });

  it("derives identity history when both selected currencies match", () => {
    const history = deriveRateHistoryData({
      baseCurrency: "USD",
      quoteCurrency: "USD",
      rates,
    });

    expect(history ? getRateHistoryRangePoints(history.points, "1D") : []).toEqual([
      { date: "2026-06-18", rate: 1 },
      { date: "2026-06-19", rate: 1 },
    ]);
    expect(
      history ? getRateHistoryStats(getRateHistoryRangePoints(history.points, "1D"))[2] : null
    ).toEqual({
      direction: "neutral",
      label: "Change",
      showIndicator: false,
      value: "0.0000",
    });
  });

  it("marks unchanged history stats as neutral", () => {
    expect(
      getRateHistoryStats([
        { date: "2026-06-18", rate: 1.25 },
        { date: "2026-06-19", rate: 1.25 },
      ])
    ).toEqual([
      { label: "Open", value: "1.2500" },
      { label: "Last", value: "1.2500" },
      { direction: "neutral", label: "Change", showIndicator: false, value: "0.0000" },
      { direction: "neutral", label: "% Change", showIndicator: true, value: "0.00%" },
    ]);
  });

  it("marks changes that round to zero as neutral", () => {
    expect(
      getRateHistoryStats([
        { date: "2026-06-18", rate: 1.25 },
        { date: "2026-06-19", rate: 1.2500001 },
      ]).slice(2)
    ).toEqual([
      { direction: "neutral", label: "Change", showIndicator: false, value: "0.0000" },
      { direction: "neutral", label: "% Change", showIndicator: true, value: "0.00%" },
    ]);
  });

  it("returns null when rates do not share one response base", () => {
    expect(
      deriveRateHistoryData({
        baseCurrency: "USD",
        quoteCurrency: "GBP",
        rates: [...rates, { date: "2026-06-19", base: "USD", quote: "EUR", rate: 0.83 }],
      })
    ).toBeNull();
  });

  it("calculates the five-year cache start date from the latest rate date", () => {
    expect(getDateYearsBefore("2026-06-19", 5)).toBe("2021-06-19");
  });
});
