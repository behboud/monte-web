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

  test("mobile navigation keeps icon links on the right", async ({ page, isMobile }) => {
    test.skip(!isMobile, "mobile navigation layout is only relevant on mobile project");

    await page.goto("/", { waitUntil: "networkidle" });

    const navigation = page.locator("#page > .pl-3 > .container").first();
    const burger = navigation.locator('a[href="#mymenu"]');
    const utensils = navigation.locator("a.fa-utensils");
    const login = navigation.locator("a.fa-user-lock");

    await expect(burger).toBeVisible();
    await expect(utensils).toBeVisible();
    await expect(login).toBeVisible();

    const burgerBox = await burger.boundingBox();
    const utensilsBox = await utensils.boundingBox();
    const loginBox = await login.boundingBox();

    expect(utensilsBox?.x).toBeGreaterThan(burgerBox?.x ?? -1);
    expect(loginBox?.x).toBeGreaterThan(utensilsBox?.x ?? -1);
  });

  test("aktuelles card CTA is visible and navigable", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });

    const cardReadMore = page.locator('a:has-text("Weiterlesen")').first();
    await expect(cardReadMore).toBeVisible();
    await cardReadMore.click();

    await expect(page).toHaveURL(/\/aktuelles\//);
    await expect(page.locator("article, main").first()).toBeVisible();
  });

  test("spenden page offers a highlighted project popup", async ({ page }) => {
    await page.goto("/spenden/", { waitUntil: "networkidle" });

    const popup = page.locator("[data-donation-popup]");
    await expect(popup).toHaveAttribute("data-open", "true");
    await expect(popup.locator("[data-donation-highlight-option]")).toHaveCount(2);

    const selectedProject = popup.locator("[data-donation-highlight-option]:not([hidden])");
    await expect(selectedProject).toHaveCount(1);
    await expect(selectedProject.locator("h2")).toBeVisible();
    await expect(selectedProject.locator(".donation-popup-action")).toHaveText(/Jetzt fördern/);
    await expect(selectedProject.locator(".donation-popup-action")).toHaveAttribute("href", "/kontakt/");

    const closeButton = popup.locator("[data-donation-popup-close]");
    const closeBox = await closeButton.boundingBox();
    expect(closeBox).not.toBeNull();
    if (!closeBox) throw new Error("The donation popup close button has no layout box.");
    await page.mouse.click(closeBox.x + closeBox.width / 2, closeBox.y + closeBox.height / 2);
    await expect(popup).toHaveAttribute("hidden", "");
  });

  test("spenden page renders its configurable top buttons", async ({ page }) => {
    await page.goto("/spenden/", { waitUntil: "networkidle" });

    const popup = page.locator("[data-donation-popup]");
    const closeButton = popup.locator("[data-donation-popup-close]");
    const closeBox = await closeButton.boundingBox();
    expect(closeBox).not.toBeNull();
    if (!closeBox) throw new Error("The donation popup close button has no layout box.");
    await page.mouse.click(closeBox.x + closeBox.width / 2, closeBox.y + closeBox.height / 2);
    await expect(popup).toHaveAttribute("hidden", "");

    const buttons = page.locator(".spenden-cta-bar a");
    await expect(buttons).toHaveCount(2);
    await expect(buttons.nth(0)).toHaveText("Jetzt online spenden");
    await expect(buttons.nth(1)).toHaveText("Als Förderer mitmachen");
    await expect(buttons.nth(0)).toHaveAttribute("href", "/kontakt");
    await expect(buttons.nth(1)).toHaveAttribute("href", "/foerderer/");
    await expect(page.locator(".spenden-cta-bar")).not.toContainText("Sachspende anbieten");
    await buttons.nth(0).click();
    await expect(page).toHaveURL(/\/kontakt\/?$/);
    await expect(page.locator("main").first()).toBeVisible();
  });

  test("back to top button appears after scrolling and returns to the top", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/schule/", { waitUntil: "networkidle" });

    const backToTop = page.locator("[data-back-to-top]");
    await expect(backToTop).toHaveAttribute("data-visible", "false");

    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await expect(backToTop).toHaveAttribute("data-visible", "true");

    await backToTop.click();
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeLessThan(10);
    await expect(backToTop).toHaveAttribute("data-visible", "false");
  });

  test("hero slider markup is present", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });

    const heroSlider = page.locator(".hero-slider");
    test.skip((await heroSlider.count()) === 0, "hero slider is not configured on this homepage content");

    const slides = page.locator(".hero-slider .swiper-slide");
    await expect(slides.first()).toBeVisible();
  });
});
