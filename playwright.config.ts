import { defineConfig, devices } from "@playwright/test";

// E2E against the dev server. Hardening (per review):
// - webServer waits on /up before tests run (no connect-before-boot races)
// - workers: 1 because specs mutate the shared dev DB (donation-count races)
// - assertions use deltas (count increased), not absolute totals
// - assets must be pre-built (`npm run build`) — esbuild's watch is not a prerequisite
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: "list",
  use: {
    baseURL: "http://localhost:3000",
    locale: "he-IL",
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "bin/rails server -p 3000",
    url: "http://localhost:3000/up",
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
