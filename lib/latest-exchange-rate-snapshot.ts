import "server-only";

import { createClient } from "@supabase/supabase-js";

import type { FrankfurterRate } from "./frankfurter";

const LATEST_SNAPSHOT_ID = "latest";

type LatestExchangeRateSnapshotRow = {
  fetched_at: string;
  id: string;
  payload: unknown;
  source_updated_at: string | null;
};

export type LatestExchangeRateSnapshot = {
  fetchedAt: string;
  rates: FrankfurterRate[];
  sourceUpdatedAt: string | null;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isOptionalBoolean(value: unknown) {
  return value === undefined || typeof value === "boolean";
}

function isFrankfurterProviderRate(value: unknown) {
  return (
    isRecord(value) &&
    typeof value.key === "string" &&
    value.key.length > 0 &&
    typeof value.rate === "number" &&
    Number.isFinite(value.rate) &&
    value.rate > 0 &&
    isOptionalBoolean(value.excluded)
  );
}

function isFrankfurterRate(value: unknown): value is FrankfurterRate {
  return (
    isRecord(value) &&
    typeof value.date === "string" &&
    value.date.length > 0 &&
    typeof value.base === "string" &&
    value.base.length > 0 &&
    typeof value.quote === "string" &&
    value.quote.length > 0 &&
    typeof value.rate === "number" &&
    Number.isFinite(value.rate) &&
    value.rate > 0 &&
    (value.providers === undefined ||
      (Array.isArray(value.providers) && value.providers.every(isFrankfurterProviderRate)))
  );
}

function parseSnapshotRates(payload: unknown) {
  if (!Array.isArray(payload) || !payload.every(isFrankfurterRate)) {
    throw new Error("Unexpected latest exchange rate snapshot payload");
  }

  return payload;
}

function createSnapshotClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

function getSourceUpdatedAt(rates: FrankfurterRate[]) {
  const latestSourceDate = rates
    .map((rate) => rate.date)
    .filter(Boolean)
    .sort()
    .at(-1);

  return latestSourceDate ? `${latestSourceDate}T00:00:00.000Z` : null;
}

export async function saveLatestExchangeRateSnapshot(rates: FrankfurterRate[], fetchedAt: string) {
  const supabase = createSnapshotClient();
  const { error } = await supabase.from("latest_exchange_rate_snapshot").upsert({
    fetched_at: fetchedAt,
    id: LATEST_SNAPSHOT_ID,
    payload: rates,
    source_updated_at: getSourceUpdatedAt(rates),
  });

  if (error) {
    throw new Error("Failed to save latest exchange rate snapshot");
  }
}

export async function getLatestExchangeRateSnapshot(): Promise<LatestExchangeRateSnapshot | null> {
  const supabase = createSnapshotClient();
  const { data, error } = await supabase
    .from("latest_exchange_rate_snapshot")
    .select("id,payload,fetched_at,source_updated_at")
    .eq("id", LATEST_SNAPSHOT_ID)
    .maybeSingle<LatestExchangeRateSnapshotRow>();

  if (error) {
    throw new Error("Failed to read latest exchange rate snapshot");
  }

  if (!data) {
    return null;
  }

  return {
    fetchedAt: data.fetched_at,
    rates: parseSnapshotRates(data.payload),
    sourceUpdatedAt: data.source_updated_at,
  };
}
