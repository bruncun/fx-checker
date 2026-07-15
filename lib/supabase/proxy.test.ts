import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { GUEST_MODE_COOKIE } from "@/features/guest-session/model/guest-session";

const { createServerClient, getClaims } = vi.hoisted(() => ({
  createServerClient: vi.fn(),
  getClaims: vi.fn(),
}));

vi.mock("@supabase/ssr", () => ({
  createServerClient,
}));

function createRequest(path: string, cookie?: string) {
  return new NextRequest(`https://fx-checker.test${path}`, {
    headers: cookie ? { cookie } : undefined,
  });
}

async function updateSessionFor(path: string, cookie?: string) {
  const { updateSession } = await import("./proxy");

  return updateSession(createRequest(path, cookie));
}

beforeEach(() => {
  vi.resetModules();
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://supabase.test");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "publishable-key");
  vi.stubEnv("FX_CHECKER_E2E_AUTH_BYPASS", undefined);
  createServerClient.mockReturnValue({
    auth: {
      getClaims,
    },
  });
  getClaims.mockResolvedValue({ data: { claims: null } });
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

describe("updateSession", () => {
  it("bootstraps guest mode for anonymous root visits", async () => {
    const response = await updateSessionFor("/");

    expect(response.headers.get("location")).toBe("https://fx-checker.test/");
    expect(response.headers.getSetCookie().join("\n")).toContain(`${GUEST_MODE_COOKIE}=1`);
  });

  it("shows root app visits to authenticated users", async () => {
    getClaims.mockResolvedValue({ data: { claims: { sub: "user-1" } } });

    const response = await updateSessionFor("/?from=USD&to=EUR");

    expect(response.headers.get("location")).toBeNull();
  });

  it.each(["/auth/login", "/auth/forgot-password", "/auth/sign-up", "/auth/sign-up-success"])(
    "redirects authenticated %s visits to the root app",
    async (path) => {
      getClaims.mockResolvedValue({ data: { claims: { sub: "user-1" } } });

      const response = await updateSessionFor(`${path}?redirectTo=%2Frate%2Flog`);

      expect(response.headers.get("location")).toBe("https://fx-checker.test/");
    }
  );

  it("shows the root app to visitors with a guest cookie", async () => {
    const response = await updateSessionFor("/", `${GUEST_MODE_COOKIE}=1`);

    expect(response.headers.get("location")).toBeNull();
    expect(createServerClient).not.toHaveBeenCalled();
  });

  it("redirects legacy app visits to root while preserving search params", async () => {
    const response = await updateSessionFor("/app?from=USD");

    expect(response.headers.get("location")).toBe("https://fx-checker.test/?from=USD");
  });
});
