import "server-only";

const DEFAULT_FRANKFURTER_BASE_URL = "https://api.frankfurter.dev/v2";
const EXCHANGE_RATES_REVALIDATE_SECONDS = 60 * 60 * 24;
const EXCHANGE_RATES_CACHE_TAG = "exchange-rates";
const FRANKFURTER_REQUEST_TIMEOUT_MS = 5_000;
const FRANKFURTER_REQUEST_ATTEMPTS = 2;
const FRANKFURTER_AUTO_CACHE_KEY = `${Date.now()}`;

type FrankfurterEndpoint = "currencies" | "rates";
type FrankfurterFetchInit = RequestInit & {
  next: {
    revalidate: number;
    tags: string[];
  };
};

const FRANKFURTER_ENDPOINT_PATHS: Record<FrankfurterEndpoint, string> = {
  currencies: "currencies",
  rates: "rates",
};

export type FrankfurterCurrency = {
  iso_code: string;
  iso_numeric?: string | null;
  name: string;
  symbol?: string | null;
  start_date?: string | null;
  end_date?: string | null;
};

export type FrankfurterRate = {
  date: string;
  base: string;
  quote: string;
  rate: number;
  providers?: Array<{
    key: string;
    rate: number;
    excluded?: boolean;
  }>;
};

function getFrankfurterBaseUrl() {
  return process.env.FRANKFURTER_API_BASE_URL ?? DEFAULT_FRANKFURTER_BASE_URL;
}

function getFrankfurterEndpointUrl(endpoint: FrankfurterEndpoint) {
  const baseUrl = getFrankfurterBaseUrl();
  const normalizedBaseUrl = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  const url = new URL(FRANKFURTER_ENDPOINT_PATHS[endpoint], normalizedBaseUrl);
  const cacheKey =
    process.env.FRANKFURTER_CACHE_KEY === "auto"
      ? FRANKFURTER_AUTO_CACHE_KEY
      : process.env.FRANKFURTER_CACHE_KEY;

  if (cacheKey) {
    url.searchParams.set("_fx_cache", cacheKey);
  }

  return url.toString();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isOptionalNullableString(value: unknown) {
  return value === undefined || value === null || typeof value === "string";
}

function isFrankfurterCurrency(value: unknown): value is FrankfurterCurrency {
  return (
    isRecord(value) &&
    typeof value.iso_code === "string" &&
    value.iso_code.length > 0 &&
    typeof value.name === "string" &&
    value.name.length > 0 &&
    isOptionalNullableString(value.iso_numeric) &&
    isOptionalNullableString(value.symbol) &&
    isOptionalNullableString(value.start_date) &&
    isOptionalNullableString(value.end_date)
  );
}

function isFrankfurterProviderRate(value: unknown) {
  return (
    isRecord(value) &&
    typeof value.key === "string" &&
    value.key.length > 0 &&
    typeof value.rate === "number" &&
    Number.isFinite(value.rate) &&
    value.rate > 0 &&
    (value.excluded === undefined || typeof value.excluded === "boolean")
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

function isRetryableStatus(status: number) {
  return status >= 500;
}

function isAbortError(error: unknown) {
  return error instanceof Error && error.name === "AbortError";
}

function logFrankfurterFailure({
  endpoint,
  error,
  status,
  url,
}: {
  endpoint: FrankfurterEndpoint;
  error: unknown;
  status?: number;
  url?: string;
}) {
  console.error("Frankfurter request failed", {
    endpoint,
    status,
    url,
    cause: error instanceof Error ? error.message : String(error),
  });
}

function getResponseUrl(response: Response) {
  return response.url || undefined;
}

async function fetchWithTimeout(url: string, init: FrankfurterFetchInit) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FRANKFURTER_REQUEST_TIMEOUT_MS);

  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchFrankfurterEndpoint(endpoint: FrankfurterEndpoint) {
  let url: string | undefined;
  let lastError: unknown;
  let lastStatus: number | undefined;

  try {
    url = getFrankfurterEndpointUrl(endpoint);
  } catch (error) {
    logFrankfurterFailure({
      endpoint,
      error,
      url,
    });

    throw new Error(`Failed to fetch ${endpoint} from Frankfurter`);
  }

  for (let attempt = 1; attempt <= FRANKFURTER_REQUEST_ATTEMPTS; attempt += 1) {
    try {
      const response = await fetchWithTimeout(url, {
        next: {
          revalidate: EXCHANGE_RATES_REVALIDATE_SECONDS,
          tags: [EXCHANGE_RATES_CACHE_TAG],
        },
      });

      if (response.ok) {
        return response;
      }

      lastStatus = response.status;
      lastError = new Error(`Frankfurter returned ${response.status}`);

      if (!isRetryableStatus(response.status)) {
        break;
      }
    } catch (error) {
      lastError = isAbortError(error)
        ? new Error(`Frankfurter request timed out after ${FRANKFURTER_REQUEST_TIMEOUT_MS}ms`)
        : error;
    }
  }

  logFrankfurterFailure({
    endpoint,
    error: lastError,
    status: lastStatus,
    url,
  });

  throw new Error(`Failed to fetch ${endpoint} from Frankfurter`);
}

export function parseFrankfurterCurrencies(data: unknown) {
  if (!Array.isArray(data) || !data.every(isFrankfurterCurrency)) {
    throw new Error("Unexpected Frankfurter currencies response");
  }

  return data;
}

export function parseFrankfurterRates(data: unknown) {
  if (!Array.isArray(data) || !data.every(isFrankfurterRate)) {
    throw new Error("Unexpected Frankfurter rates response");
  }

  return data;
}

export async function getCurrencies() {
  const response = await fetchFrankfurterEndpoint("currencies");

  try {
    return parseFrankfurterCurrencies(await response.json());
  } catch (error) {
    logFrankfurterFailure({
      endpoint: "currencies",
      error,
      url: getResponseUrl(response),
    });

    throw new Error("Failed to parse currencies from Frankfurter");
  }
}

export async function getRates() {
  const response = await fetchFrankfurterEndpoint("rates");

  try {
    return parseFrankfurterRates(await response.json());
  } catch (error) {
    logFrankfurterFailure({
      endpoint: "rates",
      error,
      url: getResponseUrl(response),
    });

    throw new Error("Failed to parse rates from Frankfurter");
  }
}
