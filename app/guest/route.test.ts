import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";

import {
  GUEST_ALERT_DISMISSED_COOKIE,
  GUEST_MODE_COOKIE,
} from "@/features/guest-session/model/guest-session";

import { GET } from "./route";

describe("guest route", () => {
  it("sets guest mode and redirects to the requested protected route", () => {
    const response = GET(
      new NextRequest("https://fx-checker.test/guest?redirectTo=%2Frate%2Flog%3Ffrom%3DUSD")
    );
    const setCookie = response.headers.getSetCookie();

    expect(response.headers.get("location")).toBe("https://fx-checker.test/rate/log?from=USD");
    expect(setCookie.find((value) => value.startsWith(`${GUEST_MODE_COOKIE}=1`))).toContain(
      "Path=/"
    );
    expect(
      setCookie.find((value) => value.startsWith(`${GUEST_ALERT_DISMISSED_COOKIE}=`))
    ).toContain("Max-Age=0");
  });

  it("falls back to the app for unsafe or auth redirects", () => {
    expect(
      GET(
        new NextRequest("https://fx-checker.test/guest?redirectTo=https://evil.test")
      ).headers.get("location")
    ).toBe("https://fx-checker.test/app");
    expect(
      GET(new NextRequest("https://fx-checker.test/guest?redirectTo=%2Fauth%2Flogin")).headers.get(
        "location"
      )
    ).toBe("https://fx-checker.test/app");
  });
});
