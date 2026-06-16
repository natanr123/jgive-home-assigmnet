import { defineConfig, devices } from "@playwright/test";

// E2E against the dev server. Hardening (per review):
// - webServer waits on /up before tests run (no connect-before-boot races)
// - workers: 1 because specs mutate the shared dev DB (donation-count races)
// - assertions use deltas (count increased), not absolute totals
// - assets must be pre-built (`npm run build`) — esbuild's watch is not a prerequisite
// Override the target with E2E_BASE_URL (e.g. a fresh server on another port) without
// editing this file; defaults to the dev server on :3000.
const baseURL = process.env.E2E_BASE_URL ?? "http://localhost:3000";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: "list",
  use: {
    baseURL,
    locale: "he-IL",
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "bin/rails server -p 3000",
    url: `${baseURL}/up`,
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
