import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { warmFrankfurterCache } = vi.hoisted(() => ({
  warmFrankfurterCache: vi.fn(),
}));

vi.mock("@/features/home/api/cache-warmup", () => ({
  warmFrankfurterCache,
}));

async function readJson(response: Response) {
  return response.json() as Promise<unknown>;
}

describe("Frankfurter cache warmup cron route", () => {
  const originalCronSecret = process.env.CRON_SECRET;

  beforeEach(() => {
    process.env.CRON_SECRET = "test-cron-secret";
    warmFrankfurterCache.mockReset();
  });

  afterEach(() => {
    process.env.CRON_SECRET = originalCronSecret;
  });

  it("rejects requests without the cron bearer secret", async () => {
    const { GET } = await import("./route");

    const response = await GET(
      new Request("https://fx-checker.test/api/cron/warm-frankfurter-cache")
    );

    expect(response.status).toBe(401);
    await expect(readJson(response)).resolves.toEqual({ error: "Unauthorized" });
    expect(warmFrankfurterCache).not.toHaveBeenCalled();
  });

  it("warms Frankfurter cache for authorized cron requests", async () => {
    const result = {
      ok: true,
      results: {
        currencyReferenceData: "available",
        historicalRates: "available",
        latestRates: "available",
        liveRates: "available",
      },
    };
    warmFrankfurterCache.mockResolvedValue(result);
    const { GET } = await import("./route");

    const response = await GET(
      new Request("https://fx-checker.test/api/cron/warm-frankfurter-cache", {
        headers: { authorization: "Bearer test-cron-secret" },
      })
    );

    expect(response.status).toBe(200);
    await expect(readJson(response)).resolves.toEqual(result);
    expect(warmFrankfurterCache).toHaveBeenCalledTimes(1);
  });

  it("surfaces unavailable warmup data as a failed cron response", async () => {
    const result = {
      ok: false,
      results: {
        currencyReferenceData: "available",
        historicalRates: "unavailable",
        latestRates: "available",
        liveRates: "available",
      },
    };
    warmFrankfurterCache.mockResolvedValue(result);
    const { GET } = await import("./route");

    const response = await GET(
      new Request("https://fx-checker.test/api/cron/warm-frankfurter-cache", {
        headers: { authorization: "Bearer test-cron-secret" },
      })
    );

    expect(response.status).toBe(502);
    await expect(readJson(response)).resolves.toEqual(result);
  });
});
