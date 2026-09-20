import { expect, test } from "@playwright/test";

test.describe("style regressions", () => {
  test("mobile menu opens and closes with local mmenu assets", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/", { waitUntil: "networkidle" });

    const menu = page.locator("#mymenu");
    await expect(menu).toHaveClass(/mm-menu/);

    await page.locator('a[href="#mymenu"]').click();
    await expect(menu).toHaveClass(/mm-menu--opened/);

    await page.locator(".mm-wrapper__blocker").click({ force: true });
    await expect(menu).not.toHaveClass(/mm-menu--opened/);
  });

  test("navigation starts at the top without the masthead", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });

    const navigation = page.locator("#page > .pl-3 > .container").first();
    await expect(navigation).toBeVisible();
    await expect(page.locator("#page > .pl-3 > header")).toHaveCount(0);
    await expect(page.locator("#logo-link")).toHaveCount(0);

    const box = await navigation.boundingBox();
    expect(box?.y).toBe(0);
  });

  test("navigation stays pinned to the top while scrolling", async ({ page }) => {
    await page.goto("/schule/", { waitUntil: "networkidle" });

    const navigationWrapper = page.locator("#page > .pl-3").first();
    await expect(navigationWrapper).toHaveCSS("position", "sticky");
    await expect(navigationWrapper).toHaveCSS("top", "0px");
    await expect(navigationWrapper).toHaveAttribute("data-scrolled", "false");

    await page.evaluate(() => window.scrollTo(0, 500));
    await expect(navigationWrapper).toHaveAttribute("data-scrolled", "true");
    await expect.poll(async () => (await navigationWrapper.boundingBox())?.y).toBe(0);

    const shadow = await navigationWrapper.evaluate((element) => getComputedStyle(element, "::before").boxShadow);
    expect(shadow).not.toBe("none");
  });

  test("navigation blends into the page background", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });

    const navigation = page.locator("#page > .pl-3 > .container").first();
    const styles = await navigation.evaluate((element) => {
      const computed = getComputedStyle(element);
      return {
        backgroundColor: computed.backgroundColor,
        boxShadow: computed.boxShadow,
      };
    });

    expect(styles.backgroundColor).toBe("rgb(255, 255, 255)");
    expect(styles.boxShadow).toBe("none");
    await expect(navigation.locator(".navbar-nav a").filter({ hasText: "Aktuelles" })).toHaveCSS("text-transform", "uppercase");
    await expect(navigation.locator("a.fa-utensils").locator("..")).toHaveClass(/ml-auto/);
  });

  test("navigation keeps the anniversary logo aligned at the far right", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });

    const navigation = page.locator("#page > .pl-3 > .container").first();
    const logo = navigation.locator('img[alt="20 Jahre Montessori Schule Gilching"]');
    const login = navigation.locator("a.fa-user-lock");
    await expect(logo).toBeVisible();
    await expect(logo).toHaveAttribute("src", /logo_20_jahre_140mm_400dpi/);

    const navigationBox = await navigation.boundingBox();
    const logoBox = await logo.boundingBox();
    const loginBox = await login.boundingBox();
    expect(navigationBox?.height).toBeLessThan(100);
    expect(Math.abs((logoBox?.height ?? 0) - (navigationBox?.height ?? 0) * 0.95)).toBeLessThanOrEqual(1);
    expect(Math.abs((logoBox?.y ?? 0) - ((navigationBox?.y ?? 0) + ((navigationBox?.height ?? 0) - (logoBox?.height ?? 0)) / 2))).toBeLessThanOrEqual(1);
    expect((logoBox?.x ?? 0) + (logoBox?.width ?? 0)).toBeGreaterThan((loginBox?.x ?? 0) + (loginBox?.width ?? 0));
  });

  test("homepage banner uses one self-hosted Playfair Display heading", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });

    const title = page.locator(".font-calligraphy");
    await expect(title).toBeVisible();
    await expect(page.getByText("Willkommen", { exact: true })).toHaveCount(1);
    await expect(page.locator('link[href*="fonts.googleapis.com"], link[href*="fonts.gstatic.com"]')).toHaveCount(0);

    const fontFamily = await title.evaluate((element) => getComputedStyle(element).fontFamily);
    expect(fontFamily).toContain("Playfair Display");

    const fontResponse = await page.request.get(new URL("/fonts/PlayfairDisplay-Regular.woff2", page.url()).href);
    expect(fontResponse.status()).toBe(200);
  });

  test("homepage shows the slider before the news stories without pagination dots", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });

    const slider = page.locator(".hero-slider").first();
    const newsHeading = page.getByRole("heading", { name: "AKTUELLES", exact: true });
    await expect(slider).toBeVisible();
    await expect(newsHeading).toBeVisible();
    await expect(page.locator(".hero-slider-pagination")).toHaveCount(0);
    await expect(page.locator(".swiper-pagination-bullet")).toHaveCount(0);

    const sliderBox = await slider.boundingBox();
    const newsHeadingBox = await newsHeading.boundingBox();
    expect(sliderBox?.y).toBeLessThan(newsHeadingBox?.y ?? Number.POSITIVE_INFINITY);
  });

  test("top-level sliders do not show pagination dots", async ({ page }) => {
    await page.goto("/schule/", { waitUntil: "networkidle" });

    await expect(page.locator(".schule-slider")).toBeVisible();
    await expect(page.locator(".hero-slider-pagination")).toHaveCount(0);
    await expect(page.locator(".swiper-pagination-bullet")).toHaveCount(0);
  });

  test("top-level pages share the title, slider, breadcrumb, and content order", async ({ page }) => {
    for (const route of ["/schule/", "/elternengagement/", "/spenden/", "/foerderer/", "/verein/", "/speiseplan/"]) {
      await page.goto(route, { waitUntil: "networkidle" });

      const title = page.locator("h1.page-title-calligraphy");
      const slider = page.locator(".schule-slider").first();
      const breadcrumb = page.locator(".breadcrumb");
      const content = page.locator(".schule-content, .spenden-cta-bar, .spenden-grid, .speiseplan-week").first();
      await expect(title).toBeVisible();
      await expect(slider).toBeVisible();
      await expect(breadcrumb).toBeVisible();
      await expect(content).toBeVisible();

      const titleBox = await title.boundingBox();
      const sliderBox = await slider.boundingBox();
      const breadcrumbBox = await breadcrumb.boundingBox();
      const contentBox = await content.boundingBox();
      expect(titleBox?.y).toBeLessThan(sliderBox?.y ?? Number.POSITIVE_INFINITY);
      expect(sliderBox?.y).toBeLessThan(breadcrumbBox?.y ?? Number.POSITIVE_INFINITY);
      expect(breadcrumbBox?.y).toBeLessThan(contentBox?.y ?? Number.POSITIVE_INFINITY);
    }
  });

  test("schule section images render before their section headings", async ({ page }) => {
    await page.goto("/schule/", { waitUntil: "networkidle" });

    const sections = [
      { heading: "WIE SIEHT EIN SCHULTAG AN DER MONTESSORISCHULE GILCHING AUS?", image: "6-_DSC7336" },
      { heading: "GEBUNDENE GANZTAGSSCHULE – UNSERE UNTERRICHTSZEITEN", image: "12-_DSC7076" },
      { heading: "DIE FÜNF SÄULEN UNSERER SCHULE", image: "Freiarbeit_1" },
    ];

    for (const section of sections) {
      const heading = page.locator(".schule-content h3").filter({ hasText: section.heading });
      await expect(heading).toHaveCount(1);

      const image = heading.locator("xpath=preceding-sibling::*[1]");
      await expect(image).toHaveClass(/section-image/);
      await expect(image.locator("img")).toHaveAttribute("src", new RegExp(section.image));

      const imageBox = await image.boundingBox();
      const headingBox = await heading.boundingBox();
      expect(imageBox?.y).toBeLessThan(headingBox?.y ?? Number.POSITIVE_INFINITY);
    }
  });

  test("schule section cards link to their matching sections", async ({ page }) => {
    await page.goto("/schule/", { waitUntil: "networkidle" });

    const cards = page.locator(".section-card");
    const expectedCards = [
      { title: "Schulalltag", href: "#schulalltag", image: "16-_DSC7588" },
      { title: "Wer wir sind", href: "#wer-wir-sind", image: "12-_DSC7076" },
      { title: "Komm zu uns", href: "#komm-zu-uns", image: "Schuleeingang" },
    ];

    await expect(cards).toHaveCount(expectedCards.length);
    for (const [index, expected] of expectedCards.entries()) {
      const card = cards.nth(index);
      await expect(card).toHaveAttribute("href", expected.href);
      await expect(card.locator("h2")).toHaveText(expected.title);
      await expect(card.locator("p")).toBeVisible();
      await expect(card.locator("img")).toHaveAttribute("src", new RegExp(expected.image));
      await expect(card.locator("button")).toHaveCount(0);
    }
  });

  test("section TOCs are hidden by default", async ({ page }) => {
    await page.goto("/schule/", { waitUntil: "networkidle" });

    await expect(page.locator(".schule-toc")).toHaveCount(0);
    await expect(page.locator("[data-mobile-toc]")).toHaveCount(0);
  });

  test("footer uses the fence image instead of the old logo", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });

    const footer = page.locator("footer");
    await expect(footer).toHaveCSS("background-color", "rgb(255, 255, 255)");

    const footerSections = footer.locator(":scope > .container > .items-center > div");
    await expect(footerSections).toHaveCount(1);

    const footerImageSection = footerSections.nth(0);
    const facebookLink = footerImageSection.locator('a[aria-label="facebook"]');
    await expect(facebookLink).toBeVisible();

    const footerImage = footerImageSection.locator("img");
    await expect(footerImage).toHaveAttribute("src", /zaun/);
    await expect(footerImage).toHaveAttribute("alt", "Bunter Zaun der Montessori Schule Gilching");
    const firstFooterLink = footerImageSection.locator("div.absolute.top-0 li").first();
    await expect(firstFooterLink).toContainText("Impressum");
    await expect(footerImageSection.locator("div.absolute.bottom-0 p")).toHaveText(/© Montessori Schule Gilching/);

    const firstLinkBox = await firstFooterLink.boundingBox();
    const facebookBox = await facebookLink.locator("..").boundingBox();
    expect(firstLinkBox).not.toBeNull();
    expect(facebookBox).not.toBeNull();
    expect(facebookBox?.y).toBeLessThan((firstLinkBox?.y ?? 0) + (firstLinkBox?.height ?? 0));
    expect(firstLinkBox?.y).toBeLessThan((facebookBox?.y ?? 0) + (facebookBox?.height ?? 0));
    await expect(footer).toHaveCSS("padding-bottom", "32px");

    if ((page.viewportSize()?.width ?? 0) < 1280) {
      const imageBox = await footerImage.boundingBox();
      const linksBox = await footerImageSection.locator("div.absolute.top-0").boundingBox();
      const copyrightBox = await footerImageSection.locator("div.absolute.bottom-0").boundingBox();

      expect(imageBox).not.toBeNull();
      expect(linksBox).not.toBeNull();
      expect(copyrightBox).not.toBeNull();
      expect((linksBox?.y ?? 0) + (linksBox?.height ?? 0)).toBeLessThanOrEqual(imageBox?.y ?? 0);
      expect(copyrightBox?.y).toBeGreaterThanOrEqual((imageBox?.y ?? 0) + (imageBox?.height ?? 0));
    }
  });

  test("aktuelles card CTA keeps white background and dark text", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });

    const cta = page.locator('a.btn.btn-default:has-text("Weiterlesen")').first();
    await expect(cta).toBeVisible();
    const buttonStyles = await cta.evaluate((el) => {
      const style = getComputedStyle(el);
      return {
        backgroundColor: style.backgroundColor,
        color: style.color,
        borderColor: style.borderColor,
      };
    });

    expect(buttonStyles.backgroundColor).not.toBe("rgb(34, 36, 119)");
    expect(buttonStyles.color).not.toBe("rgb(255, 255, 255)");
  });

  test("breadcrumb keeps trail muted and current item highlighted", async ({ page }) => {
    await page.goto("/schule/", {
      waitUntil: "networkidle",
    });

    const trailLink = page.locator(".breadcrumb li a").first();
    const currentItem = page.locator(".breadcrumb > li:last-child span");

    await expect(trailLink).toBeVisible();
    await expect(currentItem).toBeVisible();

    const breadcrumbBackground = page.locator(".breadcrumb").locator("..");
    await expect(breadcrumbBackground).toHaveCSS("background-image", "none");
    await expect(breadcrumbBackground).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
    await expect(breadcrumbBackground).toHaveCSS("border-radius", "0px");

    const { trailColor, currentColor } = await page.evaluate(() => {
      const trail = document.querySelector(".breadcrumb li a");
      const current = document.querySelector(".breadcrumb > li:last-child span");
      return {
        trailColor: trail ? getComputedStyle(trail).color : "",
        currentColor: current ? getComputedStyle(current).color : "",
      };
    });

    expect(trailColor).not.toBe(currentColor);
    expect(trailColor).toMatch(/(rgb|oklch)\(/);
    expect(currentColor).toMatch(/(rgb|oklch)\(/);
  });

  test("foerderer cards provide configurable promotion links", async ({ page }) => {
    await page.goto("/foerderer/", { waitUntil: "networkidle" });

    const cards = page.locator(".spenden-card");
    const links = page.locator(".spenden-card-link");
    await expect(cards).toHaveCount(3);
    await expect(links).toHaveCount(3);
    await expect(page.locator(".spenden-cta-bar")).toHaveCount(0);

    for (const card of await cards.all()) {
      const link = card.locator(".spenden-card-link");
      await expect(link).toHaveText(/Jetzt fördern/);
      await expect(link).toHaveAttribute("href", "/kontakt/");
    }
  });

  test("spenden entries render as consistent two-column cards", async ({ page }) => {
    await page.goto("/spenden/", { waitUntil: "networkidle" });

    const grid = page.locator(".spenden-grid");
    const cards = page.locator(".spenden-card");
    const media = page.locator(".spenden-card-image");
    await expect(grid).toBeVisible();
    await expect(cards).toHaveCount(12);
    await expect(cards.first().locator("h2")).toBeVisible();
    await expect(cards.first().locator(".spenden-card-content")).toBeVisible();

    const columns = await grid.evaluate((element) => getComputedStyle(element).gridTemplateColumns.split(" ").length);
    expect(columns).toBe((page.viewportSize()?.width ?? 0) >= 640 ? 2 : 1);

    const boxes = await media.evaluateAll((elements) =>
      elements.map((el) => {
        const rect = el.getBoundingClientRect();
        return {
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        };
      }),
    );

    const first = boxes[0];
    for (const box of boxes) {
      expect(Math.abs(box.width - first.width)).toBeLessThanOrEqual(2);
      expect(Math.abs(box.height - first.height)).toBeLessThanOrEqual(2);
    }
  });
});
