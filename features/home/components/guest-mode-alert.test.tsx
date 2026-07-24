import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  GUEST_ALERT_DISMISSED_COOKIE,
  GUEST_ALERT_SHOWN_COOKIE,
  GUEST_MODE_COOKIE,
} from "@/features/guest-session/model/guest-session";
import { GuestModeAlert } from "./guest-mode-alert";

let cookieValues = vi.hoisted(() => new Map<string, string>());

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => {
      const value = cookieValues.get(name);

      return value === undefined ? undefined : { value };
    },
  }),
}));

beforeEach(() => {
  cookieValues = new Map([[GUEST_MODE_COOKIE, "1"]]);
});

describe("GuestModeAlert", () => {
  it("remains visible after saved guest data returns to the empty state", async () => {
    cookieValues.set(GUEST_ALERT_SHOWN_COOKIE, "1");

    await expect(GuestModeAlert()).resolves.not.toBeNull();
  });

  it("stays hidden in the initial empty state", async () => {
    await expect(GuestModeAlert()).resolves.toBeNull();
  });

  it("honors an explicit dismissal after the alert has been shown", async () => {
    cookieValues.set(GUEST_ALERT_SHOWN_COOKIE, "1");
    cookieValues.set(GUEST_ALERT_DISMISSED_COOKIE, "1");

    await expect(GuestModeAlert()).resolves.toBeNull();
  });
});
