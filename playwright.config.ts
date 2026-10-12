import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.UI_BASE_URL ?? "http://localhost:4173";
if (new URL(baseURL).hostname !== "localhost") {
  throw new Error("UI_BASE_URL must use localhost.");
}

export default defineConfig({
  testDir: "./tests/ui",
  fullyParallel: true,
  timeout: 45_000,
  expect: {
    timeout: 10_000,
    toHaveScreenshot: {
      animations: "disabled",
      caret: "hide",
      scale: "css",
      maxDiffPixelRatio: 0.002,
    },
  },
  use: {
    baseURL,
    locale: "de-DE",
    timezoneId: "Europe/Berlin",
    colorScheme: "light",
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "desktop-chromium",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1366, height: 900 },
      },
    },
    {
      name: "mobile-chromium",
      use: {
        ...devices["Pixel 7"],
      },
    },
  ],
  reporter: [["html"], ["list"]],
});
