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
    await expect(menuPanel.getByRole("link", { name: "Schule", exact: true })).toHaveAttribute("href", /\/schule\/$/);
    await expect(menuPanel.getByRole("link", { name: "Speiseplan", exact: true })).toHaveAttribute("href", /\/speiseplan\/$/);
    await expect(menuPanel.getByRole("link", { name: "Eltern-Login", exact: true })).toHaveAttribute("href", "https://www.montessorischule-gilching.de/login");
  });

  test("mobile top navigation shows only the burger menu", async ({ page, isMobile }) => {
    test.skip(!isMobile, "mobile navigation layout is only relevant on mobile project");

    await page.goto("/", { waitUntil: "networkidle" });

    const navigation = page.locator("#page > .pl-3 > .container").first();
    const visibleLinks = navigation.locator(".navbar-nav a:visible");

    await expect(visibleLinks).toHaveCount(1);
    await expect(visibleLinks.first()).toHaveAttribute("href", "#mymenu");
    await expect(navigation.locator("a.fa-utensils")).toBeHidden();
    await expect(navigation.locator("a.fa-user-lock")).toBeHidden();
  });

  test("page and custom links render together in the footer", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });

    const footer = page.locator("footer .footer-links");
    await expect(footer.getByRole("link", { name: "Impressum", exact: true })).toHaveAttribute("href", /\/impressum\/$/);
    await expect(footer.getByRole("link", { name: "Kontakt", exact: true })).toHaveAttribute("href", /\/kontakt\/$/);
    await expect(footer.getByRole("link", { name: "Login", exact: true })).toHaveAttribute("href", "https://www.montessorischule-gilching.de/login");
    const instagramLink = footer.locator('a[aria-label="Instagram"]');
    await expect(instagramLink).toHaveAttribute("href", "https://www.facebook.com/");
    await expect(instagramLink).toHaveAttribute("target", "_blank");
    await expect(instagramLink).toHaveAttribute("rel", "nofollow noopener");
    await expect(instagramLink.locator("i")).toHaveClass(/fa-instagram/);
  });

  test("aktuelles card CTA is visible and navigable", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });

    const cardReadMore = page.locator('a:has-text("Weiterlesen")').first();
    await expect(cardReadMore).toBeVisible();
    await cardReadMore.click();

    await expect(page).toHaveURL(/\/aktuelles\//);
    await expect(page.locator("article, main").first()).toBeVisible();
  });

  test("spenden page combines current projects, past support, and one clear donation action", async ({ page }) => {
    await page.goto("/spenden/", { waitUntil: "networkidle" });

    const popup = page.locator("[data-donation-popup]");
    await expect(popup).toHaveAttribute("open", "");
    await expect(popup.locator("[data-donation-highlight-option]")).toHaveCount(2);

    const selectedProject = popup.locator("[data-donation-highlight-option]:not([hidden])");
    await expect(selectedProject).toHaveCount(1);
    await expect(selectedProject.locator("h2")).toBeVisible();
    await expect(selectedProject.locator(".donation-popup-action")).toHaveText(/Jetzt fördern/);
    await expect(selectedProject.locator(".donation-popup-action")).toHaveAttribute("href", "/kontakt/");

    await popup.locator("[data-donation-popup-close]").click();
    await expect(popup).not.toHaveAttribute("open", "");

    await expect(page.locator("main > section:first-child h1.page-title-calligraphy")).toHaveText("So können Sie unsere Schule unterstützen");
    const donationAction = page.locator(".donation-hero-cta");
    await expect(donationAction).toHaveCount(1);
    await expect(donationAction).toBeVisible();
    await expect(donationAction).toHaveText("Spende besprechen");
    await expect(donationAction).toHaveAttribute("href", /^mailto:Verwaltung@montessorischule-gilching\.de\?/);

    await expect(page.locator(".donation-project")).toHaveCount(3);
    await expect(page.locator(".past-donation-card")).toHaveCount(12);
    await expect(page.locator("main [data-donation-popup]")).toHaveCount(1);
    await expect(page.locator("main a:visible")).toHaveCount(1);

    const sections = await page.locator("main > section").evaluateAll((elements) => elements.map((element) => element.classList[0]));
    expect(sections[0]).toBe("container");
    expect(sections.slice(1)).toEqual(["donation-hero", "donation-projects", "past-donations"]);
  });

  test("spenden popup closes when its backdrop is clicked", async ({ page }) => {
    await page.goto("/spenden/", { waitUntil: "networkidle" });

    const popup = page.locator("[data-donation-popup]");
    await expect(popup).toHaveAttribute("open", "");
    await page.mouse.click(1, 1);
    await expect(popup).not.toHaveAttribute("open", "");
  });

  test("former foerderer route redirects to the combined donation page", async ({ page }) => {
    await page.goto("/foerderer/", { waitUntil: "networkidle" });

    await expect(page).toHaveURL(/\/spenden\/?$/);
    await expect(page.locator("main > section:first-child h1.page-title-calligraphy")).toHaveText("So können Sie unsere Schule unterstützen");
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
