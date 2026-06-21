import { afterEach, describe, expect, it, vi } from "vitest";
import {
  getCurrencies,
  getRates,
  parseFrankfurterCurrencies,
  parseFrankfurterRates,
  type FrankfurterCurrency,
  type FrankfurterRate,
} from "./frankfurter";

vi.mock("server-only", () => ({}));

const mockCurrencies: FrankfurterCurrency[] = [
  {
    iso_code: "EUR",
    name: "Euro",
  },
  {
    iso_code: "GBP",
    name: "British Pound",
  },
  {
    iso_code: "JPY",
    name: "Japanese Yen",
  },
  {
    iso_code: "USD",
    name: "US Dollar",
  },
];

const mockRates: FrankfurterRate[] = [
  { date: "2026-06-19", base: "EUR", quote: "GBP", rate: 0.8542 },
  { date: "2026-06-19", base: "EUR", quote: "USD", rate: 1.171 },
];

describe("parseFrankfurterCurrencies", () => {
  it("returns valid Frankfurter currency rows", () => {
    expect(parseFrankfurterCurrencies(mockCurrencies)).toEqual(mockCurrencies);
  });

  it("throws for object-map shape", () => {
    expect(() => parseFrankfurterCurrencies({ EUR: "Euro" })).toThrow(
      "Unexpected Frankfurter currencies response"
    );
  });

  it("throws when currency records are missing required fields", () => {
    expect(() => parseFrankfurterCurrencies([{ iso_code: "EUR" }])).toThrow(
      "Unexpected Frankfurter currencies response"
    );
  });
});

describe("parseFrankfurterRates", () => {
  it("returns rate rows matching the OpenAPI response shape", () => {
    expect(parseFrankfurterRates(mockRates)).toEqual(mockRates);
  });

  it("throws for the legacy object-map response shape", () => {
    expect(() => parseFrankfurterRates({ base: "EUR", rates: { USD: 1.171 } })).toThrow(
      "Unexpected Frankfurter rates response"
    );
  });

  it("throws for invalid or non-positive rate values", () => {
    expect(() =>
      parseFrankfurterRates([{ date: "2026-06-19", base: "EUR", quote: "USD", rate: 0 }])
    ).toThrow("Unexpected Frankfurter rates response");
  });
});

describe("getCurrencies", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("fetches currencies from the configured Frankfurter base URL", async () => {
    vi.stubEnv("FRANKFURTER_API_BASE_URL", "http://localhost:3100/v2");

    const fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(mockCurrencies),
    });

    vi.stubGlobal("fetch", fetch);

    await expect(getCurrencies()).resolves.toEqual(mockCurrencies);
    expect(fetch).toHaveBeenCalledWith("http://localhost:3100/v2/currencies", {
      next: {
        revalidate: 86_400,
        tags: ["exchange-rates"],
      },
      signal: expect.any(AbortSignal),
    });
  });

  it("uses the Frankfurter currencies endpoint by default", async () => {
    const fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(mockCurrencies),
    });

    vi.stubGlobal("fetch", fetch);

    await getCurrencies();
    expect(fetch).toHaveBeenCalledWith(
      "https://api.frankfurter.dev/v2/currencies",
      expect.any(Object)
    );
  });

  it("can add a cache key for deterministic tests", async () => {
    vi.stubEnv("FRANKFURTER_CACHE_KEY", "currencies-array");

    const fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(mockCurrencies),
    });

    vi.stubGlobal("fetch", fetch);

    await getCurrencies();
    expect(fetch).toHaveBeenCalledWith(
      "https://api.frankfurter.dev/v2/currencies?_fx_cache=currencies-array",
      {
        next: {
          revalidate: 86_400,
          tags: ["exchange-rates"],
        },
        signal: expect.any(AbortSignal),
      }
    );
  });

  it("retries once when Frankfurter returns a server error", async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 503,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue(mockCurrencies),
      });

    vi.stubGlobal("fetch", fetch);

    await expect(getCurrencies()).resolves.toEqual(mockCurrencies);
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it("does not retry client errors", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    const fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
    });

    vi.stubGlobal("fetch", fetch);

    await expect(getCurrencies()).rejects.toThrow("Failed to fetch currencies from Frankfurter");
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(consoleError).toHaveBeenCalledWith("Frankfurter request failed", {
      endpoint: "currencies",
      status: 404,
      url: "https://api.frankfurter.dev/v2/currencies",
      cause: "Frankfurter returned 404",
    });
  });

  it("logs malformed endpoint configuration before throwing", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    vi.stubEnv("FRANKFURTER_API_BASE_URL", "not a url");

    await expect(getCurrencies()).rejects.toThrow("Failed to fetch currencies from Frankfurter");
    expect(consoleError).toHaveBeenCalledOnce();
  });

  it("logs malformed response bodies before throwing", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    const fetch = vi.fn().mockResolvedValue({
      ok: true,
      url: "https://api.frankfurter.dev/v2/currencies",
      json: vi.fn().mockResolvedValue({ EUR: "Euro" }),
    });

    vi.stubGlobal("fetch", fetch);

    await expect(getCurrencies()).rejects.toThrow("Failed to parse currencies from Frankfurter");
    expect(consoleError).toHaveBeenCalledWith("Frankfurter request failed", {
      endpoint: "currencies",
      status: undefined,
      url: "https://api.frankfurter.dev/v2/currencies",
      cause: "Unexpected Frankfurter currencies response",
    });
  });
});

describe("getRates", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("fetches and parses the shared-base rates endpoint", async () => {
    const fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(mockRates),
    });

    vi.stubGlobal("fetch", fetch);

    await expect(getRates()).resolves.toEqual(mockRates);
    expect(fetch).toHaveBeenCalledWith("https://api.frankfurter.dev/v2/rates", {
      next: {
        revalidate: 86_400,
        tags: ["exchange-rates"],
      },
      signal: expect.any(AbortSignal),
    });
  });

  it("rejects rate endpoint failures after retrying a server error", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    const fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
    });

    vi.stubGlobal("fetch", fetch);

    await expect(getRates()).rejects.toThrow("Failed to fetch rates from Frankfurter");
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(consoleError).toHaveBeenCalledWith("Frankfurter request failed", {
      endpoint: "rates",
      status: 503,
      url: "https://api.frankfurter.dev/v2/rates",
      cause: "Frankfurter returned 503",
    });
  });

  it("rejects malformed rates responses", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        url: "https://api.frankfurter.dev/v2/rates",
        json: vi.fn().mockResolvedValue({ rates: { USD: 1.171 } }),
      })
    );

    await expect(getRates()).rejects.toThrow("Failed to parse rates from Frankfurter");
    expect(consoleError).toHaveBeenCalledWith("Frankfurter request failed", {
      endpoint: "rates",
      status: undefined,
      url: "https://api.frankfurter.dev/v2/rates",
      cause: "Unexpected Frankfurter rates response",
    });
  });
});
