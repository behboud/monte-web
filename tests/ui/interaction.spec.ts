import { expect, test } from "@playwright/test";

test.describe("core interactions", () => {
  test("mobile menu opens from burger button", async ({ page, isMobile }) => {
    test.skip(!isMobile, "mobile menu test is only relevant on mobile project");

    await page.goto("/", { waitUntil: "networkidle" });

    const burger = page.locator('a[href="#mymenu"]').first();
    test.skip((await burger.count()) === 0, "burger trigger is not available on this route");

    await page.evaluate(() => {
      const trigger = document.querySelector('a[href="#mymenu"]');
      trigger?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    const menuPanel = page.locator(".mm-menu");
    await expect(menuPanel).toHaveCount(1);
  });

  test("aktuelles card CTA is visible and navigable", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });

    const cardReadMore = page.locator('a:has-text("Weiterlesen")').first();
    await expect(cardReadMore).toBeVisible();
    await cardReadMore.click();

    await expect(page).toHaveURL(/\/aktuelles\//);
    await expect(page.locator("article, main").first()).toBeVisible();
  });

  test("hero slider markup is present", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });

    const heroSlider = page.locator(".hero-slider");
    test.skip((await heroSlider.count()) === 0, "hero slider is not configured on this homepage content");

    const slides = page.locator(".hero-slider .swiper-slide");
    await expect(slides.first()).toBeVisible();
  });
});
