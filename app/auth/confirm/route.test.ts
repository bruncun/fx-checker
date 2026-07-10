import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { redirect, verifyOtp } = vi.hoisted(() => ({
  redirect: vi.fn(),
  verifyOtp: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect,
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: {
      verifyOtp,
    },
  }),
}));

describe("auth confirmation route", () => {
  beforeEach(() => {
    redirect.mockReset();
    redirect.mockImplementation((url: string) => {
      throw Object.assign(new Error("NEXT_REDIRECT"), { url });
    });
    verifyOtp.mockReset();
  });

  it("redirects successful confirmations to safe local paths", async () => {
    verifyOtp.mockResolvedValue({ error: null });
    const { GET } = await import("./route");

    await expect(
      GET(
        new NextRequest(
          "https://fx-checker.test/auth/confirm?token_hash=token&type=email&next=%2Fapp%3Ffrom%3DUSD"
        )
      )
    ).rejects.toThrow("NEXT_REDIRECT");

    expect(redirect).toHaveBeenCalledWith("/app?from=USD");
  });

  it("falls back to root for unsafe next redirects", async () => {
    verifyOtp.mockResolvedValue({ error: null });
    const { GET } = await import("./route");

    await expect(
      GET(
        new NextRequest(
          "https://fx-checker.test/auth/confirm?token_hash=token&type=email&next=https%3A%2F%2Fevil.test"
        )
      )
    ).rejects.toThrow("NEXT_REDIRECT");

    expect(redirect).toHaveBeenCalledWith("/");
  });
});
