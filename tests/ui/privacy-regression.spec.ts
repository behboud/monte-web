import { expect, test } from "@playwright/test";

const publicRoutes = ["/", "/schule/", "/spenden/", "/foerderer/", "/kontakt/", "/datenschutz/", "/impressum/"];

const isExternalRequest = (url: string) => {
  const hostname = new URL(url).hostname;
  return hostname !== "127.0.0.1" && hostname !== "localhost";
};

test.describe("privacy regressions", () => {
  test("public routes stay same-origin and do not set cookies", async ({ browser }) => {
    const context = await browser.newContext();
    const externalRequests: string[] = [];
    context.on("request", (request) => {
      if (isExternalRequest(request.url())) {
        externalRequests.push(request.url());
      }
    });

    const page = await context.newPage();
    for (const route of publicRoutes) {
      await page.goto(route, { waitUntil: "networkidle" });
      await expect(page.locator('link[href*="fonts.googleapis.com"], link[href*="fonts.gstatic.com"]')).toHaveCount(0);
      await expect(page.locator('link[rel="manifest"]')).toHaveCount(0);
      await expect(page.locator("iframe, form[action]")).toHaveCount(0);
    }

    expect(externalRequests).toEqual([]);
    expect(await context.cookies()).toEqual([]);
    expect(await page.evaluate(() => document.cookie)).toBe("");
    expect(
      await page.evaluate(async () => {
        if (!navigator.serviceWorker) return 0;
        return (await navigator.serviceWorker.getRegistrations()).length;
      }),
    ).toBe(0);

    const serviceWorkerResponse = await context.request.get("/service-worker.js");
    expect(serviceWorkerResponse.status()).toBe(404);

    await context.close();
  });

  test("donation page does not interrupt with a popup or store a dismissal", async ({ page }) => {
    await page.goto("/spenden/", { waitUntil: "networkidle" });

    await expect(page.locator("[data-donation-popup]")).toHaveCount(0);
    await expect(page.locator(".donation-hero-cta")).toBeVisible();
    expect(await page.evaluate(() => sessionStorage.getItem("monte-donation-highlight-dismissed"))).toBeNull();
    expect(await page.evaluate(() => localStorage.getItem("monte-donation-highlight-dismissed"))).toBeNull();
    expect(await page.evaluate(() => document.cookie)).toBe("");
  });
});
