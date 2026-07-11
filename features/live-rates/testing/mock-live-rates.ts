import type { LiveRate } from "../components/live-rate-item";

export const mockLiveRates: LiveRate[] = [
  { pair: "EUR/USD", rate: "1.1723", change: "-0.14%", direction: "down" },
  { pair: "USD/JPY", rate: "157.91", change: "+0.04%", direction: "up" },
  { pair: "GBP/USD", rate: "1.3575", change: "-0.22%", direction: "down" },
  { pair: "USD/CHF", rate: "0.9098", change: "+0.13%", direction: "up" },
  { pair: "EUR/GBP", rate: "0.8633", change: "+0.11%", direction: "up" },
  { pair: "AUD/USD", rate: "0.7208", change: "+0.08%", direction: "up" },
  { pair: "USD/CAD", rate: "1.3815", change: "+0.04%", direction: "up" },
];
