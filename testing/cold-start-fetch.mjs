// Loaded only by the cold-start production test. No external requests are sent.
import { readFileSync } from "node:fs";
import { join } from "node:path";
const rates = JSON.parse(
  readFileSync(join(process.cwd(), "cypress/fixtures/frankfurter-rates.json"))
);
const currencies = JSON.parse(
  readFileSync(join(process.cwd(), "cypress/fixtures/frankfurter-currencies.json"))
);
let release;
const pending = new Promise((resolve) => {
  release = resolve;
});
process.on("message", (message) => {
  if (message === "release-data") release();
});
globalThis.fetch = async (input) => {
  const url = new URL(typeof input === "string" ? input : (input.url ?? input.toString()));
  process.send?.({
    type: "data-request",
    path: url.pathname,
    select: url.searchParams.get("select"),
  });
  await pending;
  if (url.pathname.endsWith("/latest_exchange_rate_data_snapshot")) {
    return Response.json({
      id: "latest",
      source_date: rates[0].date,
      fetched_at: new Date().toISOString(),
      latest_rates: rates,
      daily_3m: rates,
      weekly_1y: rates,
      monthly_5y: rates,
    });
  }
  if (url.pathname.endsWith("/currencies")) return Response.json(currencies);
  if (url.pathname.endsWith("/rates")) return Response.json(rates);
  return Response.json(null);
};
