import { NextRequest } from "next/server";
import { describe, expect, it, vi } from "vitest";

import {
  GUEST_ALERT_DISMISSED_COOKIE,
  GUEST_CONVERSIONS_COOKIE,
  GUEST_FAVORITES_COOKIE,
  GUEST_MODE_COOKIE,
} from "@/features/guest-session/guest-session";

import { POST } from "./route";

const { signOut } = vi.hoisted(() => ({
  signOut: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: {
      signOut,
    },
  }),
}));

vi.mock("@/lib/utils", () => ({
  hasEnvVars: true,
}));

describe("sign-out route", () => {
  it("signs out, clears guest session cookies, and redirects to login", async () => {
    signOut.mockResolvedValue({ error: null });

    const response = await POST(new NextRequest("https://fx-checker.test/auth/sign-out"));
    const setCookie = response.headers.getSetCookie();

    expect(signOut).toHaveBeenCalled();
    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("https://fx-checker.test/auth/login");
    expect(setCookie).toHaveLength(4);

    [
      GUEST_MODE_COOKIE,
      GUEST_FAVORITES_COOKIE,
      GUEST_CONVERSIONS_COOKIE,
      GUEST_ALERT_DISMISSED_COOKIE,
    ].forEach((name) => {
      const cookie = setCookie.find((value) => value.startsWith(`${name}=`));

      expect(cookie).toContain("Path=/");
      expect(cookie).toContain("Max-Age=0");
    });
  });
});
