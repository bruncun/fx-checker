import { describe, expect, it } from "vitest";

import { config } from "./proxy";

const matcher = new RegExp(`^${config.matcher[0]}$`);

describe("proxy matcher", () => {
  it.each(["/manifest.webmanifest", "/manifest.json"])(
    "does not proxy %s so browsers receive manifest content without auth redirects",
    (pathname) => {
      expect(matcher.test(pathname)).toBe(false);
    }
  );

  it.each(["/app", "/rate/log", "/auth/login"])("proxies app route %s", (pathname) => {
    expect(matcher.test(pathname)).toBe(true);
  });

  it.each(["/images/favicon.svg", "/images/favicon-32x32.png", "/favicon.ico"])(
    "does not proxy static icon %s",
    (pathname) => {
      expect(matcher.test(pathname)).toBe(false);
    }
  );
});
