import "server-only";

import { createClient } from "@supabase/supabase-js";

import { parseFrankfurterRates, type FrankfurterRate } from "./frankfurter";

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

function parseSnapshotRates(payload: unknown) {
  try {
    return parseFrankfurterRates(payload);
  } catch {
    throw new Error("Unexpected latest exchange rate snapshot payload");
  }
}

function createSnapshotReadClient() {
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

function createSnapshotWriteClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is required to save latest exchange rate snapshots");
  }

  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

function getSourceUpdatedAt(rates: FrankfurterRate[]) {
  const latestSourceDate = rates.reduce<string | null>((latestDate, rate) => {
    if (!rate.date) {
      return latestDate;
    }

    return latestDate === null || rate.date > latestDate ? rate.date : latestDate;
  }, null);

  return latestSourceDate ? `${latestSourceDate}T00:00:00.000Z` : null;
}

export async function saveLatestExchangeRateSnapshot(rates: FrankfurterRate[], fetchedAt: string) {
  const supabase = createSnapshotWriteClient();
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
  const supabase = createSnapshotReadClient();
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
