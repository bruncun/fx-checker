import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";

import {
  GUEST_ALERT_DISMISSED_COOKIE,
  GUEST_CONVERSIONS_COOKIE,
  GUEST_FAVORITES_COOKIE,
  GUEST_MODE_COOKIE,
} from "@/features/guest-session/model/guest-session";

import { GET } from "./route";

function getSetCookieValue(setCookie: string[], name: string) {
  const cookie = setCookie.find((value) => value.startsWith(`${name}=`));
  const value = cookie?.split(";")[0]?.slice(name.length + 1);
  const unquotedValue = value?.startsWith('"') && value.endsWith('"') ? value.slice(1, -1) : value;

  return unquotedValue ? decodeURIComponent(unquotedValue) : unquotedValue;
}

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
    expect(getSetCookieValue(setCookie, GUEST_FAVORITES_COOKIE)).toBeUndefined();
    expect(getSetCookieValue(setCookie, GUEST_CONVERSIONS_COOKIE)).toBeUndefined();
    expect(
      setCookie.find((value) => value.startsWith(`${GUEST_ALERT_DISMISSED_COOKIE}=`))
    ).toContain("Max-Age=0");
  });

  it("does not replace existing guest favorites or conversions", () => {
    const response = GET(
      new NextRequest("https://fx-checker.test/guest", {
        headers: {
          cookie: `${GUEST_FAVORITES_COOKIE}=existing-favorites; ${GUEST_CONVERSIONS_COOKIE}=existing-conversions`,
        },
      })
    );
    const setCookie = response.headers.getSetCookie();

    expect(
      setCookie.find((value) => value.startsWith(`${GUEST_FAVORITES_COOKIE}=`))
    ).toBeUndefined();
    expect(
      setCookie.find((value) => value.startsWith(`${GUEST_CONVERSIONS_COOKIE}=`))
    ).toBeUndefined();
  });

  it("falls back to the app for unsafe or auth redirects", () => {
    expect(
      GET(
        new NextRequest("https://fx-checker.test/guest?redirectTo=https://evil.test")
      ).headers.get("location")
    ).toBe("https://fx-checker.test/");
    expect(
      GET(new NextRequest("https://fx-checker.test/guest?redirectTo=%2Fauth%2Flogin")).headers.get(
        "location"
      )
    ).toBe("https://fx-checker.test/");
  });
});
