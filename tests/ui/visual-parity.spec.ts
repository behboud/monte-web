import { expect, test } from "@playwright/test";

const publicRoutes = [
  { name: "home", path: "/" },
  { name: "aktuelles", path: "/aktuelles/" },
  { name: "news-post-1", path: "/aktuelles/post-1/" },
  { name: "news-post-2", path: "/aktuelles/post-2/" },
  { name: "news-post-3", path: "/aktuelles/post-3/" },
  { name: "news-post-4", path: "/aktuelles/post-4/" },
  { name: "news-membership-2025", path: "/aktuelles/2025-03-24-mitgliederversammlung-cms-2025/" },
  { name: "categories", path: "/categories/" },
  { name: "privacy", path: "/datenschutz/" },
  { name: "parent-engagement", path: "/elternengagement/" },
  { name: "supporters", path: "/foerderer/" },
  { name: "imprint", path: "/impressum/" },
  { name: "career", path: "/karriere/" },
  { name: "contact", path: "/kontakt/" },
  { name: "pages", path: "/pages/" },
  { name: "press", path: "/presse/" },
  { name: "school", path: "/schule/" },
  { name: "meal-plan", path: "/speiseplan/" },
  { name: "donations", path: "/spenden/" },
  { name: "tags", path: "/tags/" },
  { name: "tag-members", path: "/tags/mitglieder/" },
  { name: "tag-appointments", path: "/tags/termin/" },
  { name: "association", path: "/verein/" },
  { name: "not-found", path: "/__migration-visual-not-found__/" },
] as const;

const waitForPageAssets = async (page: import("@playwright/test").Page) => {
  await page.locator("img").evaluateAll((images: HTMLImageElement[]) => {
    for (const image of images) image.loading = "eager";
  });
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all(Array.from(document.images, (image) => image.decode().catch(() => undefined)));
  });
};

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    Math.random = () => 0.25;
  });
});

for (const route of publicRoutes) {
  test(`full-page baseline: ${route.name}`, async ({ page }) => {
    const response = await page.goto(route.path, { waitUntil: "networkidle" });
    expect(response?.status()).toBe(route.name === "not-found" ? 404 : 200);
    await waitForPageAssets(page);
    await expect(page).toHaveScreenshot(`${route.name}.png`, { fullPage: true });
  });
}

test("donation highlight popup open", async ({ page }) => {
  await page.goto("/spenden/", { waitUntil: "networkidle" });
  await expect(page.locator("[data-donation-popup]")).toHaveAttribute("data-open", "true");
  await waitForPageAssets(page);
  await expect(page).toHaveScreenshot("donation-popup-open.png");
});

test("donation page after dismissing the highlight popup", async ({ page }) => {
  await page.goto("/spenden/", { waitUntil: "networkidle" });
  const popup = page.locator("[data-donation-popup]");
  await expect(popup).toHaveAttribute("data-open", "true");
  await popup.locator("[data-donation-popup-close]").click();
  await expect(popup).toHaveAttribute("hidden", "");
  await waitForPageAssets(page);
  await expect(page).toHaveScreenshot("donation-popup-dismissed.png", { fullPage: true });
});

test("mobile navigation open", async ({ page, isMobile }) => {
  test.skip(!isMobile, "The expanded navigation is a mobile-only state.");
  await page.goto("/", { waitUntil: "networkidle" });
  await page.locator('a[href="#mymenu"]').first().click();
  await expect(page.locator("#mymenu")).toHaveClass(/mm-menu--opened/);
  await waitForPageAssets(page);
  await expect(page).toHaveScreenshot("mobile-navigation-open.png");
});
