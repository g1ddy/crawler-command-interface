import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/concepts",
  outputDir: "test-results/concepts",
  workers: 1,
  retries: 0,
  reporter: "list",
  use: { baseURL: "http://127.0.0.1:4175/crawler-command-interface/", reducedMotion: "reduce", trace: "retain-on-failure" },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 1080 } } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
  webServer: {
    command: "npm run build:concepts && npx vite preview --config vite.pages.config.ts --mode concepts --host 127.0.0.1 --port 4175",
    port: 4175,
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
