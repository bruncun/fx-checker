import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { createFavorite, deleteFavorite } = vi.hoisted(() => ({
  createFavorite: vi.fn(),
  deleteFavorite: vi.fn(),
}));

vi.mock("@/features/favorites/api/actions", () => ({
  createFavorite,
  deleteFavorite,
}));

async function readJson(response: Response) {
  return response.json() as Promise<unknown>;
}

describe("favorites API route", () => {
  beforeEach(() => {
    createFavorite.mockReset();
    deleteFavorite.mockReset();
  });

  it("rejects malformed favorite payloads", async () => {
    const { POST } = await import("./route");
    const response = await POST(
      new NextRequest("https://fx-checker.test/api/favorites", {
        body: JSON.stringify({ fromCurrency: "USD", toCurrency: "USD" }),
        method: "POST",
      })
    );

    expect(response.status).toBe(400);
    await expect(readJson(response)).resolves.toEqual({ error: "Invalid favorite currency pair" });
    expect(createFavorite).not.toHaveBeenCalled();
  });

  it("passes normalized favorite payloads to the action", async () => {
    createFavorite.mockResolvedValue({
      createdAt: "2026-07-08T09:00:00.000Z",
      fromCurrency: "USD",
      id: "favorite-id",
      toCurrency: "EUR",
    });
    const { POST } = await import("./route");

    const response = await POST(
      new NextRequest("https://fx-checker.test/api/favorites", {
        body: JSON.stringify({ fromCurrency: " usd ", toCurrency: "eur" }),
        method: "POST",
      })
    );

    expect(response.status).toBe(200);
    expect(createFavorite).toHaveBeenCalledWith({ fromCurrency: "USD", toCurrency: "EUR" });
  });
});
