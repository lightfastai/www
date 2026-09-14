import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  workers: 1,
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:4187",
    ...devices["Desktop Chrome"],
    trace: "retain-on-failure",
  },
  webServer: {
    command: "pnpm exec next start --hostname 127.0.0.1 --port 4187",
    url: "http://127.0.0.1:4187",
    reuseExistingServer: false,
    env: {
      SKIP_ENV_VALIDATION: "true",
      RESEND_API_KEY: "",
      ARCJET_KEY: "",
      SLACK_WEBHOOK_URL: "",
      SENTRY_AUTH_TOKEN: "",
    },
  },
});
