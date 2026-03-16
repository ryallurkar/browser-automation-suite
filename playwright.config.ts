import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";

dotenv.config({ quiet: true });

export default defineConfig({
  testDir: "./tests",
  testMatch: ["**/*.spec.ts"],
  reporter: [["html", { open: "on-failure" }], ["list"]],
  fullyParallel: false,
  retries: 1,
  timeout: 60000,
  use: {
    headless: false,
    actionTimeout: 10000,
    navigationTimeout: 30000,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "setup",
      testDir: "./",
      testMatch: /auth\.setup\.ts/,
    },
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        storageState: "auth.json",
      },
      dependencies: ["setup"],
    },
  ],
});
