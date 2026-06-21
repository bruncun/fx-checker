import { createServer, type Server } from "node:http";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { defineConfig } from "cypress";

const mockCurrenciesPath = join(process.cwd(), "cypress/fixtures/frankfurter-currencies.json");
const mockCurrencies = readFileSync(mockCurrenciesPath, "utf8");
const mockRatesPath = join(process.cwd(), "cypress/fixtures/frankfurter-rates.json");
const mockRates = readFileSync(mockRatesPath, "utf8");

let mockServer: Server | null = null;
let shouldFailCurrenciesRequest = false;

function startMockServer() {
  if (mockServer) {
    return Promise.resolve();
  }

  mockServer = createServer((request, response) => {
    const pathname = new URL(request.url ?? "/", "http://127.0.0.1").pathname;

    if (pathname === "/v2/currencies") {
      if (shouldFailCurrenciesRequest) {
        response.writeHead(503, { "Content-Type": "application/json" });
        response.end(JSON.stringify({ error: "Service unavailable" }));
        return;
      }

      response.writeHead(200, { "Content-Type": "application/json" });
      response.end(mockCurrencies);
      return;
    }

    if (pathname === "/v2/rates") {
      response.writeHead(200, { "Content-Type": "application/json" });
      response.end(mockRates);
      return;
    }

    response.writeHead(404, { "Content-Type": "application/json" });
    response.end(JSON.stringify({ error: "Not found" }));
  });

  return new Promise<void>((resolve) => {
    mockServer?.listen(3100, "127.0.0.1", resolve);
  });
}

function stopMockServer() {
  return new Promise<void>((resolve) => {
    if (!mockServer) {
      resolve();
      return;
    }

    mockServer.close(() => {
      mockServer = null;
      resolve();
    });
  });
}

export default defineConfig({
  e2e: {
    baseUrl: "http://localhost:3101",
    allowCypressEnv: false,
    supportFile: "cypress/support/e2e.ts",
    async setupNodeEvents(on, config) {
      await startMockServer();

      on("task", {
        resetFrankfurterMock() {
          shouldFailCurrenciesRequest = false;
          return null;
        },
        failFrankfurterCurrencies() {
          shouldFailCurrenciesRequest = true;
          return null;
        },
      });

      on("after:run", async () => {
        await stopMockServer();
      });

      return config;
    },
  },
});
