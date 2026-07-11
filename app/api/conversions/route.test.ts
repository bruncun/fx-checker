import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { createConversionAction, deleteAllConversionsAction } = vi.hoisted(() => ({
  createConversionAction: vi.fn(),
  deleteAllConversionsAction: vi.fn(),
}));

vi.mock("@/features/conversion-log/api/actions", () => ({
  createConversionAction,
  deleteAllConversionsAction,
}));

async function readJson(response: Response) {
  return response.json() as Promise<unknown>;
}

describe("conversions API route", () => {
  beforeEach(() => {
    createConversionAction.mockReset();
    deleteAllConversionsAction.mockReset();
  });

  it("rejects malformed conversion payloads", async () => {
    const { POST } = await import("./route");
    const response = await POST(
      new NextRequest("https://fx-checker.test/api/conversions", {
        body: JSON.stringify({
          fromCurrency: "USD",
          receiveAmount: "",
          sendAmount: "100",
          toCurrency: "EUR",
        }),
        method: "POST",
      })
    );

    expect(response.status).toBe(400);
    await expect(readJson(response)).resolves.toEqual({ error: "Invalid conversion" });
    expect(createConversionAction).not.toHaveBeenCalled();
  });

  it("passes normalized conversion payloads to the action", async () => {
    createConversionAction.mockResolvedValue({
      createdAt: "2026-07-08T09:00:00.000Z",
      fromCurrency: "USD",
      id: "conversion-id",
      receiveAmount: "86.50",
      sendAmount: "100",
      toCurrency: "EUR",
    });
    const { POST } = await import("./route");

    const response = await POST(
      new NextRequest("https://fx-checker.test/api/conversions", {
        body: JSON.stringify({
          fromCurrency: " usd ",
          receiveAmount: "86.50",
          sendAmount: "100",
          toCurrency: "eur",
        }),
        method: "POST",
      })
    );

    expect(response.status).toBe(200);
    expect(createConversionAction).toHaveBeenCalledWith({
      fromCurrency: "USD",
      receiveAmount: "86.50",
      sendAmount: "100",
      toCurrency: "EUR",
    });
  });
});
