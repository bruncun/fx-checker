import { describe, expect, it } from "vitest";

import { cn } from "./utils";

describe("cn", () => {
  it("keeps design typography presets alongside project text colors", () => {
    expect(cn("text-preset-5 text-neutral-50")).toBe("text-preset-5 text-neutral-50");
    expect(cn("text-neutral-50 text-preset-5")).toBe("text-neutral-50 text-preset-5");
  });

  it("still merges conflicting typography presets and project text colors", () => {
    expect(cn("text-preset-5 text-preset-4")).toBe("text-preset-4");
    expect(cn("text-neutral-50 text-neutral-200 text-preset-5")).toBe(
      "text-neutral-200 text-preset-5"
    );
  });

  it("handles variant-scoped typography preset conflicts independently", () => {
    expect(cn("text-preset-6 sm:text-preset-6 sm:text-preset-4 text-neutral-200")).toBe(
      "text-preset-6 sm:text-preset-4 text-neutral-200"
    );
  });
});
