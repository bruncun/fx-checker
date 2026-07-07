import { describe, expect, it } from "vitest";

import { getSafeRedirectPath } from "./login-form";

describe("login form redirects", () => {
  it("defaults auth-page sign-ins to the dashboard", () => {
    expect(getSafeRedirectPath(null)).toBe("/app");
    expect(getSafeRedirectPath("https://example.test/app")).toBe("/app");
    expect(getSafeRedirectPath("//example.test/app")).toBe("/app");
  });
});
