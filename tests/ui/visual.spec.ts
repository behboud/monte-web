import fs from "node:fs";
import path from "node:path";
import { expect, test } from "@playwright/test";

const routesPath = path.resolve(process.cwd(), "tests/ui/fixtures/routes.json");
const routes = JSON.parse(fs.readFileSync(routesPath, "utf8")) as string[];
const stabilizeCssPath = path.resolve(process.cwd(), "tests/ui/fixtures/stabilize.css");

const nameForSnapshot = (route: string) => {
  if (route === "/") {
    return "home";
  }

  return route
    .replace(/^\//, "")
    .replace(/\/$/, "")
    .replace(/[^a-zA-Z0-9-_]/g, "-")
    .replace(/-+/g, "-");
};

for (const route of routes) {
  test(`visual parity ${route}`, async ({ page }) => {
    await page.goto(route, { waitUntil: "networkidle" });
    await page.addStyleTag({ path: stabilizeCssPath });
    await page.evaluate(async () => {
      if (document.fonts?.ready) {
        await document.fonts.ready;
      }
    });

    await expect(page).toHaveScreenshot(`${nameForSnapshot(route)}.png`, {
      fullPage: true,
      animations: "disabled",
      caret: "hide",
      scale: "css",
    });
  });
}
