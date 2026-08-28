import { defineConfig, devices } from "@playwright/test";

const PORT = 4174;
const BASE_URL = `http://127.0.0.1:${PORT}`;

export default defineConfig({
  testDir: "./tests/screenshots",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  workers: 1,
  reporter: "list",
  use: {
    baseURL: BASE_URL,
    trace: "retain-on-failure",
    reducedMotion: "reduce",
  },
  projects: [
    {
      name: "desktop-chromium",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 1100 },
      },
    },
  ],
  webServer: {
    command: `npm run build:pages && npx vite preview --config vite.pages.config.ts --host 127.0.0.1 --port ${PORT}`,
    port: PORT,
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
