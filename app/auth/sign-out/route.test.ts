import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";

import {
  GUEST_ALERT_DISMISSED_COOKIE,
  GUEST_CONVERSIONS_COOKIE,
  GUEST_FAVORITES_COOKIE,
  GUEST_MODE_COOKIE,
} from "@/features/guest-session/guest-session";

import { GET } from "./route";

describe("sign-out route", () => {
  it("clears guest session cookies before redirecting to login", () => {
    const response = GET(new NextRequest("https://fx-checker.test/auth/sign-out"));
    const setCookie = response.headers.getSetCookie();

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
