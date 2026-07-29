import "server-only";

import { createClient } from "@supabase/supabase-js";
import { cacheLife, cacheTag, io } from "next/cache";

import { parseFrankfurterRates, type FrankfurterRate } from "./frankfurter";

const LATEST_DATA_SNAPSHOT_ID = "latest";

export const LATEST_EXCHANGE_RATE_DATA_SNAPSHOT_CACHE_TAG = "latest-exchange-rate-data-snapshot";

export type CanonicalHistoryDataset = "daily-3m" | "monthly-5y" | "weekly-1y";
export type ExchangeRateSnapshotDataset = CanonicalHistoryDataset | "latest";

type LatestExchangeRateDataSnapshotRow = {
  daily_3m?: unknown;
  fetched_at: string;
  id: string;
  latest_rates?: unknown;
  monthly_5y?: unknown;
  source_date: string;
  weekly_1y?: unknown;
};

export type LatestExchangeRateDataSnapshot = {
  dataset: ExchangeRateSnapshotDataset;
  fetchedAt: string;
  rates: FrankfurterRate[];
  sourceDate: string;
};

type SaveLatestExchangeRateDataSnapshotInput = {
  fetchedAt: string;
  historicalRates: Record<CanonicalHistoryDataset, FrankfurterRate[]>;
  latestRates: FrankfurterRate[];
  sourceDate: string;
};

const SNAPSHOT_COLUMN_BY_DATASET: Record<
  ExchangeRateSnapshotDataset,
  keyof LatestExchangeRateDataSnapshotRow
> = {
  "daily-3m": "daily_3m",
  "monthly-5y": "monthly_5y",
  "weekly-1y": "weekly_1y",
  latest: "latest_rates",
};

function parseSnapshotRates(payload: unknown, dataset: ExchangeRateSnapshotDataset) {
  try {
    const rates = parseFrankfurterRates(payload);

    if (rates.length === 0) {
      throw new Error("Empty snapshot payload");
    }

    return rates;
  } catch {
    throw new Error(`Unexpected ${dataset} exchange rate data snapshot payload`);
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
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is required to save exchange rate data snapshots");
  }

  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export async function saveLatestExchangeRateDataSnapshot({
  fetchedAt,
  historicalRates,
  latestRates,
  sourceDate,
}: SaveLatestExchangeRateDataSnapshotInput) {
  const validatedLatestRates = parseSnapshotRates(latestRates, "latest");
  const validatedDailyRates = parseSnapshotRates(historicalRates["daily-3m"], "daily-3m");
  const validatedWeeklyRates = parseSnapshotRates(historicalRates["weekly-1y"], "weekly-1y");
  const validatedMonthlyRates = parseSnapshotRates(historicalRates["monthly-5y"], "monthly-5y");
  const supabase = createSnapshotWriteClient();
  const { error } = await supabase.from("latest_exchange_rate_data_snapshot").upsert({
    daily_3m: validatedDailyRates,
    fetched_at: fetchedAt,
    id: LATEST_DATA_SNAPSHOT_ID,
    latest_rates: validatedLatestRates,
    monthly_5y: validatedMonthlyRates,
    source_date: sourceDate,
    weekly_1y: validatedWeeklyRates,
  });

  if (error) {
    throw new Error("Failed to save latest exchange rate data snapshot");
  }
}

export async function getLatestExchangeRateDataSnapshot(
  dataset: ExchangeRateSnapshotDataset
): Promise<LatestExchangeRateDataSnapshot | null> {
  const column = SNAPSHOT_COLUMN_BY_DATASET[dataset];
  const supabase = createSnapshotReadClient();
  const { data, error } = await supabase
    .from("latest_exchange_rate_data_snapshot")
    .select(`id,source_date,fetched_at,${column}`)
    .eq("id", LATEST_DATA_SNAPSHOT_ID)
    .maybeSingle<LatestExchangeRateDataSnapshotRow>();

  if (error) {
    throw new Error("Failed to read latest exchange rate data snapshot");
  }

  if (!data) {
    return null;
  }

  return {
    dataset,
    fetchedAt: data.fetched_at,
    rates: parseSnapshotRates(data[column], dataset),
    sourceDate: data.source_date,
  };
}

export async function getCachedLatestExchangeRateDataSnapshot(
  dataset: ExchangeRateSnapshotDataset
) {
  await io();

  return loadCachedLatestExchangeRateDataSnapshot(dataset);
}

async function loadCachedLatestExchangeRateDataSnapshot(dataset: ExchangeRateSnapshotDataset) {
  "use cache: remote";
  cacheTag(LATEST_EXCHANGE_RATE_DATA_SNAPSHOT_CACHE_TAG);

  try {
    const snapshot = await getLatestExchangeRateDataSnapshot(dataset);

    if (snapshot) {
      cacheLife("days");
    } else {
      cacheLife("minutes");
    }

    return snapshot;
  } catch (error) {
    // A missing migration or transient database failure must not fail a build
    // or become a day-long negative cache entry.
    cacheLife("seconds");
    console.error("Failed to load cached exchange rate data snapshot", {
      cause: error instanceof Error ? error.message : String(error),
      dataset,
    });

    return null;
  }
}
