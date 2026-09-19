import { defineConfig, devices } from "@playwright/test";

const port = process.env.PLAYWRIGHT_PORT ?? "3001";
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://127.0.0.1:${port}`;
const isCi = process.env.CI === "true";
const e2eAllowed = isCi || process.env.PLAYWRIGHT_ALLOW_LOCAL_E2E === "1";
const shouldStartServer = process.env.PLAYWRIGHT_SKIP_WEBSERVER !== "1";

if (!e2eAllowed) {
  throw new Error(
    "Playwright is CI-only for this project. Run npm run verify locally; browser E2E runs in GitHub Actions.",
  );
}

export default defineConfig({
  testDir: "./e2e",
  globalTimeout: 120_000,
  globalTeardown: "./e2e/global-teardown.mjs",
  timeout: 20_000,
  expect: {
    timeout: 10_000,
  },
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  webServer: shouldStartServer
    ? {
        command: "node e2e/dev-server.mjs",
        reuseExistingServer: !isCi,
        timeout: 300_000,
        url: baseURL,
      }
    : undefined,
  projects: [
    {
      name: "desktop-chrome",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "tablet-chrome",
      use: { ...devices["Galaxy Tab S4"] },
    },
    {
      name: "mobile-chrome",
      use: { ...devices["Pixel 7"] },
    },
  ],
});
