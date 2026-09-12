import assert from "node:assert/strict";
import { fork } from "node:child_process";
import { createServer, get } from "node:http";
import { once } from "node:events";
import { resolve } from "node:path";
import test from "node:test";

// Run after `npm run build`. A fresh process has no request-time cache entries.
for (const cookie of ["", "fx_checker_guest=1"]) {
  test(
    `cold dashboard streams with pending data (${cookie ? "returning guest" : "first visitor"})`,
    { timeout: 20000 },
    async (t) => {
      const portProbe = createServer();
      portProbe.listen(0, "127.0.0.1");
      await once(portProbe, "listening");
      const port = portProbe.address().port;
      await new Promise((resolve) => portProbe.close(resolve));

      const server = fork(
        resolve("node_modules/next/dist/bin/next"),
        ["start", "-p", String(port)],
        {
          execArgv: ["--import", resolve("testing/cold-start-fetch.mjs")],
          env: { ...process.env, NODE_ENV: "production" },
          silent: true,
        }
      );
      t.after(() => server.kill());
      let logs = "";
      const requests = [];
      server.on("message", (message) => {
        if (message.type === "data-request") requests.push(message);
      });
      server.stderr.on("data", (chunk) => {
        logs += chunk;
      });
      await new Promise((resolve, reject) => {
        server.stdout.on("data", (chunk) => {
          logs += chunk;
          if (logs.includes("Ready in")) resolve();
        });
        server.once("exit", () => reject(new Error(logs)));
      });

      const startedAt = performance.now();
      let html = "";
      let released = false;
      await new Promise((resolve, reject) => {
        const request = get(
          `http://127.0.0.1:${port}/`,
          {
            headers: { Cookie: cookie, "User-Agent": "Mozilla/5.0" },
          },
          (response) => {
            assert.equal(response.statusCode, 200);
            response.on("data", (chunk) => {
              html += chunk;
              if (
                !released &&
                html.includes("Check the Rate") &&
                html.includes('aria-label="Chart"')
              ) {
                // No data response has been released: these must be visible shell elements.
                assert.ok(html.includes('aria-label="Loading exchange rate"'));
                assert.ok(html.includes("Market snapshot"));
                assert.equal((html.match(/aria-label="Account menu"/g) ?? []).length, 1);
                t.diagnostic(
                  `Visible shell received in ${Math.round(performance.now() - startedAt)} ms, before releasing data`
                );
                released = true;
                server.send("release-data");
              }
            });
            response.on("end", resolve);
            response.on("error", reject);
          }
        );
        request.on("error", reject);
        t.after(() => request.destroy());
      });
      assert.ok(released, "The shell must render before data resolves");
      assert.ok(
        requests.some(({ select }) => select?.includes("latest_rates")),
        logs
      );
      assert.ok(
        requests.some(({ select }) => select?.includes("daily_3m")),
        logs
      );
      assert.ok(!html.includes('data-dgst="'), `Unexpected rendering error: ${logs}`);
    }
  );
}
