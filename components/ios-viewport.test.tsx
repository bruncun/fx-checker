// @vitest-environment jsdom

import { cleanup, render, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { IOSViewport } from "./ios-viewport";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  document.head.innerHTML = "";
});

function addViewport() {
  const viewport = document.createElement("meta");
  viewport.name = "viewport";
  viewport.content = "width=device-width, initial-scale=1";
  document.head.append(viewport);

  return viewport;
}

describe("IOSViewport", () => {
  it("adds a maximum scale on iOS", async () => {
    const viewport = addViewport();
    vi.spyOn(navigator, "userAgent", "get").mockReturnValue(
      "Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15"
    );

    render(<IOSViewport />);

    await waitFor(() => {
      expect(viewport.content).toBe("width=device-width, initial-scale=1, maximum-scale=1");
    });
  });

  it("leaves the viewport unrestricted on other devices", async () => {
    const viewport = addViewport();
    vi.spyOn(navigator, "userAgent", "get").mockReturnValue(
      "Mozilla/5.0 (Linux; Android 15) AppleWebKit/537.36 Chrome/136.0 Mobile Safari/537.36"
    );

    render(<IOSViewport />);

    await waitFor(() => {
      expect(viewport.content).toBe("width=device-width, initial-scale=1");
    });
  });
});
