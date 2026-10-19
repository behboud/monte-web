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
    await expect(navigation.locator("a.fa-utensils").locator("..")).not.toHaveClass(/ml-auto/);
  });

  test("desktop navigation groups utility icons with the main links", async ({ page }) => {
    test.skip((page.viewportSize()?.width ?? 0) < 768, "desktop navigation spacing is not relevant on mobile");

    await page.goto("/", { waitUntil: "networkidle" });

    const navigation = page.locator("#page > .pl-3 > .container").first();
    const utensilsItem = navigation.locator("a.fa-utensils").locator("..");
    const lastTextItem = utensilsItem.locator("xpath=preceding-sibling::li[1]");
    const loginItem = navigation.locator("a.fa-user-lock").locator("..");
    await expect(lastTextItem).toContainText("Verein");

    const lastTextBox = await lastTextItem.boundingBox();
    const utensilsBox = await utensilsItem.boundingBox();
    const loginBox = await loginItem.boundingBox();
    expect(lastTextBox).not.toBeNull();
    expect(utensilsBox).not.toBeNull();
    expect(loginBox).not.toBeNull();
    if (!lastTextBox || !utensilsBox || !loginBox) throw new Error("The navigation items should have layout boxes.");

    const gapBeforeUtilities = utensilsBox.x - (lastTextBox.x + lastTextBox.width);
    const gapBetweenUtilities = loginBox.x - (utensilsBox.x + utensilsBox.width);
    expect(gapBeforeUtilities).toBeGreaterThanOrEqual(0);
    expect(gapBeforeUtilities).toBeLessThan(100);
    expect(gapBetweenUtilities).toBeGreaterThanOrEqual(0);
    expect(gapBetweenUtilities).toBeLessThan(100);
  });

  test("navigation no longer carries the anniversary logo", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });

    const navigation = page.locator("#page > .pl-3 > .container").first();
    await expect(navigation.locator('img[alt="20 Jahre Montessori Schule Gilching"]')).toHaveCount(0);
  });

  test("homepage pairs its title with a responsive anniversary logo", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });

    const title = page.getByRole("heading", { name: "Willkommen", exact: true });
    const logo = page.locator(".home-banner-logo");
    await expect(title).toBeVisible();
    await expect(logo).toBeVisible();
    await expect(logo).toHaveAttribute("alt", "20 Jahre Montessori Schule Gilching");
    await expect(logo).toHaveAttribute("src", /logo_20_jahre_140mm_400dpi/);
    await expect(page.getByText("Willkommen", { exact: true })).toHaveCount(1);
    await expect(page.locator('link[href*="fonts.googleapis.com"], link[href*="fonts.gstatic.com"]')).toHaveCount(0);

    const fontFamily = await title.evaluate((element) => getComputedStyle(element).fontFamily);
    expect(fontFamily).toContain("Playfair Display");

    const fontResponse = await page.request.get(new URL("/fonts/PlayfairDisplay-Regular.woff2", page.url()).href);
    expect(fontResponse.status()).toBe(200);

    const sizes: number[] = [];
    for (const width of [320, 390, 1366]) {
      await page.setViewportSize({ width, height: 900 });
      const measurements = await page.evaluate(() => {
        const title = document.querySelector(".home-banner-title");
        const logo = document.querySelector(".home-banner-logo");
        const heading = document.querySelector(".home-banner-heading");
        if (!title || !logo || !heading) throw new Error("Homepage title and logo should render");

        const titleBox = title.getBoundingClientRect();
        const logoBox = logo.getBoundingClientRect();
        const headingBox = heading.getBoundingClientRect();
        return {
          viewportWidth: window.innerWidth,
          titleFontSize: Number.parseFloat(getComputedStyle(title).fontSize),
          titleLeft: titleBox.left,
          titleCenter: titleBox.top + titleBox.height / 2,
          titleRight: titleBox.right,
          logoCenter: logoBox.top + logoBox.height / 2,
          logoHeight: logoBox.height,
          logoRight: logoBox.right,
          headingRight: headingBox.right,
        };
      });

      expect(Math.abs(measurements.logoHeight - measurements.titleFontSize)).toBeLessThanOrEqual(1);
      expect(Math.abs(measurements.logoCenter - measurements.titleCenter)).toBeLessThanOrEqual(1);
      expect(measurements.logoRight).toBeLessThanOrEqual(measurements.titleLeft + 1);
      expect(measurements.titleRight).toBeLessThanOrEqual(measurements.headingRight + 1);
      expect(measurements.titleRight).toBeLessThanOrEqual(measurements.viewportWidth);
      expect(measurements.headingRight).toBeLessThanOrEqual(width + 1);
      sizes.push(measurements.titleFontSize);
    }

    expect(sizes[0]).toBeLessThan(sizes[1]);
    expect(sizes[1]).toBeLessThan(sizes[2]);
    expect(sizes[2]).toBe(80);
  });

  test("page titles use a reduced responsive size", async ({ page }) => {
    await page.goto("/elternengagement/", { waitUntil: "networkidle" });

    const title = page.locator(".page-title-calligraphy");
    await expect(title).toBeVisible();
    const sizes: number[] = [];

    for (const width of [320, 390, 1366]) {
      await page.setViewportSize({ width, height: 900 });
      const fontSize = await title.evaluate((element) => Number.parseFloat(getComputedStyle(element).fontSize));
      sizes.push(fontSize);
    }

    expect(sizes[0]).toBe(32);
    expect(sizes[0]).toBeLessThan(sizes[1]);
    expect(sizes[1]).toBeLessThan(sizes[2]);
    expect(sizes[2]).toBe(80);
  });

  test("prose keeps a consistent measure and rhythm across page types", async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 900 });

    const examples = [
      { route: "/schule/", selector: ".schule-content p" },
      { route: "/elternengagement/", selector: ".reading-prose p" },
      { route: "/aktuelles/", selector: ".reading-prose" },
      { route: "/aktuelles/post-4/", selector: ".article-reading-column p" },
      { route: "/spenden/", selector: ".past-donation-content" },
    ];

    for (const { route, selector } of examples) {
      await page.goto(route, { waitUntil: "networkidle" });

      const measurement = await page.locator(selector).evaluateAll((textBlocks) => {
        const textBlock = textBlocks.find((candidate) => (candidate.textContent ?? "").trim().length > 120);
        if (!textBlock) throw new Error("A long text block should exist on this page.");

        const rectangle = textBlock.getBoundingClientRect();
        const style = getComputedStyle(textBlock);
        const main = document.querySelector("main");
        if (!main) throw new Error("Page main should exist.");

        return {
          textLength: (textBlock.textContent ?? "").trim().length,
          width: rectangle.width,
          maxInlineSize: style.maxInlineSize,
          fontFamily: style.fontFamily,
          fontSize: Number.parseFloat(style.fontSize),
          lineHeight: Number.parseFloat(style.lineHeight),
          mainWidth: main.getBoundingClientRect().width,
        };
      });

      expect(measurement.textLength).toBeGreaterThan(120);
      expect(measurement.maxInlineSize).not.toBe("none");
      expect(measurement.fontFamily).toContain("Overpass");
      expect(measurement.fontSize).toBe(18);
      expect(measurement.lineHeight).toBeCloseTo(26.1, 1);
      expect(measurement.width).toBeLessThan(measurement.mainWidth * 0.6);
    }

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/schule/", { waitUntil: "networkidle" });

    const mobileMeasurement = await page.locator(".schule-content p").evaluateAll((textBlocks) => {
      const textBlock = textBlocks.find((candidate) => (candidate.textContent ?? "").trim().length > 120);
      if (!textBlock) throw new Error("A long text block should exist on the school page.");

      const content = textBlock.closest(".schule-content");
      if (!content) throw new Error("The school content container should contain the text block.");

      return {
        textWidth: textBlock.getBoundingClientRect().width,
        contentWidth: content.getBoundingClientRect().width,
        documentWidth: document.documentElement.scrollWidth,
      };
    });

    expect(mobileMeasurement.textWidth).toBeLessThanOrEqual(mobileMeasurement.contentWidth);
    expect(mobileMeasurement.documentWidth).toBeLessThanOrEqual(390);
  });

  test("page prose containers are frameless across top-level pages", async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 900 });

    for (const route of ["/schule/", "/elternengagement/", "/verein/", "/speiseplan/", "/kontakt/", "/impressum/", "/datenschutz/", "/presse/"]) {
      await page.goto(route, { waitUntil: "networkidle" });

      const content = page.locator(".schule-content").first();
      await expect(content).toBeVisible();

      const frame = await content.evaluate((element) => {
        const style = getComputedStyle(element);
        return {
          backgroundColor: style.backgroundColor,
          borderTopWidth: style.borderTopWidth,
          boxShadow: style.boxShadow,
          paddingBlockStart: style.paddingBlockStart,
        };
      });

      expect(frame.backgroundColor).toBe("rgba(0, 0, 0, 0)");
      expect(frame.borderTopWidth).toBe("0px");
      expect(frame.boxShadow).toBe("none");
      expect(frame.paddingBlockStart).toBe("0px");
      await expect(content).not.toHaveClass(/card/);
    }
  });

  test("inline Markdown section text is constrained to the reading measure", async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 900 });
    await page.goto("/schule/", { waitUntil: "networkidle" });

    const paragraph = page.locator(".schule-content p").filter({ hasText: "Für einen kompakten Überblick zu Maria Montessori" });
    await expect(paragraph).toHaveCount(1);

    const measurement = await paragraph.evaluate((element) => {
      const main = document.querySelector("main");
      if (!main) throw new Error("Page main should exist.");

      return {
        maxInlineSize: getComputedStyle(element).maxInlineSize,
        paragraphWidth: element.getBoundingClientRect().width,
        mainWidth: main.getBoundingClientRect().width,
      };
    });

    expect(measurement.maxInlineSize).not.toBe("none");
    expect(measurement.paragraphWidth).toBeLessThan(measurement.mainWidth * 0.6);
  });

  test("prose links use Monte blue and underline on hover", async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 900 });
    await page.goto("/schule/", { waitUntil: "networkidle" });

    const link = page.locator(".reading-prose a").filter({ hasText: "Montessorilandesverbands" });
    await expect(link).toHaveCount(1);

    const linkColor = await link.evaluate((element) => getComputedStyle(element).color);
    const navigationColor = await page.locator('.navbar-nav a[href="/schule/"]').evaluate((element) => getComputedStyle(element).color);
    expect(linkColor).toBe(navigationColor);
    await expect(link).toHaveCSS("text-decoration-line", "none");

    await link.hover();
    await expect(link).toHaveCSS("text-decoration-line", "underline");
    await expect(link).toHaveCSS("text-underline-offset", "4px");
  });

  test("school prose uses the same reading rhythm as other pages", async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 900 });
    await page.goto("/schule/", { waitUntil: "networkidle" });

    const rhythm = await page.locator(".schule-content").evaluate((content) => {
      const proseBlock = [...content.querySelectorAll(".reading-prose")].find((block) => [...block.querySelectorAll(":scope > p")].some((paragraph) => paragraph.nextElementSibling?.tagName === "P"));
      if (!proseBlock) throw new Error("A prose block with consecutive paragraphs should exist.");

      const paragraph = [...proseBlock.querySelectorAll(":scope > p")].find((candidate) => candidate.nextElementSibling?.tagName === "P");
      if (!paragraph || !paragraph.nextElementSibling) throw new Error("Consecutive paragraphs should exist.");

      const list = content.querySelector(".reading-prose ul");
      if (!list) throw new Error("A content list should exist.");

      const paragraphStyle = getComputedStyle(paragraph);
      const listStyle = getComputedStyle(list);
      return {
        fontFamily: paragraphStyle.fontFamily,
        fontSize: Number.parseFloat(paragraphStyle.fontSize),
        lineHeight: Number.parseFloat(paragraphStyle.lineHeight),
        paragraphGap: Number.parseFloat(getComputedStyle(paragraph.nextElementSibling).marginBlockStart),
        measure: paragraph.getBoundingClientRect().width,
        listStyle: listStyle.listStyleType,
        listIndent: Number.parseFloat(listStyle.paddingInlineStart),
      };
    });

    expect(rhythm.fontFamily).toContain("Overpass");
    expect(rhythm.fontSize).toBe(18);
    expect(rhythm.lineHeight).toBeCloseTo(26.1, 1);
    expect(rhythm.paragraphGap).toBe(18);
    expect(rhythm.measure).toBeGreaterThan(600);
    expect(rhythm.measure).toBeLessThanOrEqual(682);
    expect(rhythm.listStyle).toBe("disc");
    expect(rhythm.listIndent).toBeGreaterThan(0);
  });

  test("homepage shows the slider before news cards without a redundant heading or pagination dots", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });

    const slider = page.locator(".hero-slider").first();
    const newsGrid = page.locator("main .flex.flex-row.flex-wrap").first();
    await expect(slider).toBeVisible();
    await expect(newsGrid).toBeVisible();
    await expect(newsGrid.locator("h3.card-title").first()).toBeVisible();
    await expect(page.getByRole("heading", { name: "AKTUELLES", exact: true })).toHaveCount(0);
    await expect(page.locator(".hero-slider-pagination")).toHaveCount(0);
    await expect(page.locator(".swiper-pagination-bullet")).toHaveCount(0);

    const sliderBox = await slider.boundingBox();
    const newsGridBox = await newsGrid.boundingBox();
    expect(sliderBox?.y).toBeLessThan(newsGridBox?.y ?? Number.POSITIVE_INFINITY);
  });

  test("homepage matches the title-to-slider spacing used on section pages", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });

    const homeTitle = page.locator(".home-banner-heading");
    const homeSlider = page.locator(".hero-slider").first();
    const homeTitleBox = await homeTitle.boundingBox();
    const homeSliderBox = await homeSlider.boundingBox();
    expect(homeTitleBox).not.toBeNull();
    expect(homeSliderBox).not.toBeNull();
    if (!homeTitleBox || !homeSliderBox) throw new Error("Homepage title and slider should have layout boxes.");

    await page.goto("/schule/", { waitUntil: "networkidle" });

    const sectionTitle = page.locator(".page-title-calligraphy");
    const sectionSlider = page.locator(".schule-slider").first();
    const sectionTitleBox = await sectionTitle.boundingBox();
    const sectionSliderBox = await sectionSlider.boundingBox();
    expect(sectionTitleBox).not.toBeNull();
    expect(sectionSliderBox).not.toBeNull();
    if (!sectionTitleBox || !sectionSliderBox) throw new Error("Section title and slider should have layout boxes.");

    const homeGap = homeSliderBox.y - (homeTitleBox.y + homeTitleBox.height);
    const sectionGap = sectionSliderBox.y - (sectionTitleBox.y + sectionTitleBox.height);
    expect(Math.abs(homeGap - sectionGap)).toBeLessThanOrEqual(1);
  });

  test("homepage slider-to-content spacing matches section pages", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });

    const homeSlider = page.locator(".hero-slider").first();
    const newsGrid = page.locator("main .flex.flex-row.flex-wrap").first();
    const homeSliderBox = await homeSlider.boundingBox();
    const newsGridBox = await newsGrid.boundingBox();
    expect(homeSliderBox).not.toBeNull();
    expect(newsGridBox).not.toBeNull();
    if (!homeSliderBox || !newsGridBox) throw new Error("Homepage slider and news grid should have layout boxes.");

    await page.goto("/schule/", { waitUntil: "networkidle" });

    const sectionSlider = page.locator(".schule-slider").first();
    const sectionCards = page.locator(".section-cards").first();
    const sectionSliderBox = await sectionSlider.boundingBox();
    const sectionCardsBox = await sectionCards.boundingBox();
    expect(sectionSliderBox).not.toBeNull();
    expect(sectionCardsBox).not.toBeNull();
    if (!sectionSliderBox || !sectionCardsBox) throw new Error("Section slider and following content should have layout boxes.");

    const homeGap = newsGridBox.y - (homeSliderBox.y + homeSliderBox.height);
    const sectionGap = sectionCardsBox.y - (sectionSliderBox.y + sectionSliderBox.height);
    expect(Math.abs(homeGap - sectionGap)).toBeLessThanOrEqual(1);
  });

  test("top-level sliders do not show pagination dots", async ({ page }) => {
    await page.goto("/schule/", { waitUntil: "networkidle" });

    await expect(page.locator(".schule-slider")).toBeVisible();
    await expect(page.locator(".hero-slider-pagination")).toHaveCount(0);
    await expect(page.locator(".swiper-pagination-bullet")).toHaveCount(0);
  });

  test("top-level pages share the title, slider, and content order without breadcrumbs", async ({ page }) => {
    for (const route of ["/schule/", "/elternengagement/", "/verein/", "/speiseplan/"]) {
      await page.goto(route, { waitUntil: "networkidle" });

      const title = page.locator("h1.page-title-calligraphy");
      const slider = page.locator(".schule-slider").first();
      const content = page.locator(".schule-content, .speiseplan-week").first();
      await expect(title).toBeVisible();
      await expect(slider).toBeVisible();
      await expect(page.locator(".breadcrumb")).toHaveCount(0);
      await expect(content).toBeVisible();

      const titleBox = await title.boundingBox();
      const sliderBox = await slider.boundingBox();
      const contentBox = await content.boundingBox();
      expect(titleBox?.y).toBeLessThan(sliderBox?.y ?? Number.POSITIVE_INFINITY);
      expect(sliderBox?.y).toBeLessThan(contentBox?.y ?? Number.POSITIVE_INFINITY);
    }
  });

  test("school uses the shared section renderer and page-wide heading style", async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 900 });
    await page.goto("/schule/", { waitUntil: "networkidle" });

    await expect(page.locator("h1.page-title-calligraphy")).toHaveText("Unsere Schule");
    await expect(page.locator(".schule-slider")).toBeVisible();
    await expect(page.locator(".section-card")).toHaveCount(3);
    await expect(page.locator(".schule-content")).toHaveClass("schule-content");
    await expect(page.locator("[data-content-layout]")).toHaveCount(0);
    await expect(page.locator("#schulalltag")).toHaveText("Schulalltag");
    await expect(page.locator("#qualitaeten")).toHaveText("Qualitäten unserer pädagogischen Arbeit");
    await expect(page.locator("#wie-sieht-ein-schultag-bei-uns-aus")).toHaveText("Wie sieht ein Schultag an der Montessorischule Gilching aus?");

    const headings = await page.locator(".schule-content :is(h2, h3, h4)").evaluateAll((elements) => elements.map((element) => element.textContent?.trim() ?? ""));
    expect(headings.every((title) => title !== title.toLocaleUpperCase("de-DE"))).toBe(true);

    for (const width of [1366, 390]) {
      await page.setViewportSize({ width, height: 900 });
      const headingLayout = await page.locator("#wie-sieht-ein-schultag-bei-uns-aus").evaluate((heading) => {
        const prose = heading.nextElementSibling;
        return {
          headingWidth: heading.getBoundingClientRect().width,
          proseWidth: prose?.getBoundingClientRect().width ?? 0,
        };
      });
      expect(headingLayout.headingWidth).toBeLessThanOrEqual(headingLayout.proseWidth + 1);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    }
  });

  test("section headings have room before sibling headings and following text", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    for (const width of [1366, 390]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/schule/", { waitUntil: "networkidle" });

      const spacing = await page.evaluate(() => {
        const teamHeading = document.getElementById("schulleitung-und-team");
        const administrationHeading = document.getElementById("verwaltung");
        const administrationContent = administrationHeading?.nextElementSibling;
        const pupilsHeading = document.getElementById("schuelerinnen");
        const pupilsContent = pupilsHeading?.nextElementSibling;
        if (!teamHeading || !administrationHeading || !administrationContent || !pupilsHeading || !pupilsContent) {
          throw new Error("The expected subsection headings and prose should exist.");
        }

        const gap = (first: Element, next: Element) => next.getBoundingClientRect().top - first.getBoundingClientRect().bottom;
        return {
          betweenHeadings: gap(teamHeading, administrationHeading),
          beforeAdministrationText: gap(administrationHeading, administrationContent),
          beforePupilsText: gap(pupilsHeading, pupilsContent),
        };
      });

      expect(spacing.betweenHeadings).toBeGreaterThanOrEqual(20);
      expect(spacing.beforeAdministrationText).toBeGreaterThanOrEqual(16);
      expect(spacing.beforePupilsText).toBeGreaterThanOrEqual(16);
    }
  });

  test("area-link images can be shown as full-width, centered section banners", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/schule/", { waitUntil: "networkidle" });
    await expect(page.locator(".section-banner")).toHaveCount(2);
    await expect(page.locator('[data-section-banner="schulalltag"]')).toHaveCount(0);

    const expectedBanners = [
      { id: "wer-wir-sind", image: "12-_DSC7076", alt: "Wer wir sind" },
      { id: "komm-zu-uns", image: "Schuleeingang", alt: "Komm zu uns" },
    ];

    for (const width of [390, 640, 768, 1024, 1366]) {
      await page.setViewportSize({ width, height: 900 });
      const sliderBox = await page.locator(".schule-slider").boundingBox();
      expect(sliderBox).not.toBeNull();
      if (!sliderBox) throw new Error("The page slider should have a layout box.");

      for (const expected of expectedBanners) {
        const banner = page.locator(`[data-section-banner="${expected.id}"]`);
        const image = banner.locator("img");
        await expect(banner).toHaveCount(1);
        await expect(image).toHaveAttribute("src", new RegExp(expected.image));
        await expect(image).toHaveAttribute("alt", expected.alt);
        await expect(image).toHaveCSS("object-fit", "cover");
        await expect(image).toHaveCSS("object-position", "50% 50%");

        const bannerLayout = await page.evaluate((sectionID) => {
          const banner = document.querySelector(`[data-section-banner="${sectionID}"]`);
          const image = banner?.querySelector("img");
          const heading = document.getElementById(sectionID);
          const previousItem = banner?.previousElementSibling;
          if (!banner || !image || !heading || !previousItem) throw new Error("The banner or its surrounding content is missing.");
          return {
            viewportWidth: document.documentElement.clientWidth,
            bannerWidth: banner.getBoundingClientRect().width,
            bannerHeight: banner.getBoundingClientRect().height,
            imageWidth: image.getBoundingClientRect().width,
            imageHeight: image.getBoundingClientRect().height,
            gapBefore: banner.getBoundingClientRect().top - previousItem.getBoundingClientRect().bottom,
            gapAfter: heading.getBoundingClientRect().top - banner.getBoundingClientRect().bottom,
            bannerTop: banner.getBoundingClientRect().top,
            headingTop: heading.getBoundingClientRect().top,
          };
        }, expected.id);

        expect(bannerLayout.bannerWidth).toBe(bannerLayout.viewportWidth);
        expect(bannerLayout.imageWidth).toBe(bannerLayout.viewportWidth);
        expect(bannerLayout.imageHeight).toBe(sliderBox.height);
        expect(bannerLayout.bannerHeight).toBe(sliderBox.height);
        expect(bannerLayout.gapBefore).toBeGreaterThanOrEqual(39);
        expect(Math.abs(bannerLayout.gapBefore - bannerLayout.gapAfter)).toBeLessThanOrEqual(1);
        expect(bannerLayout.bannerTop).toBeLessThan(bannerLayout.headingTop);
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    }
  });

  test("content images stay within the text measure on desktop and mobile", async ({ page }) => {
    for (const width of [1366, 390]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/schule/", { waitUntil: "networkidle" });

      const imageLayout = await page.locator(".schule-content .reading-prose img:not(.section-banner-image):not(.circle-items-image)").evaluateAll((images) =>
        images.map((image) => {
          const textBlock = image.closest("p, ul, ol, blockquote") ?? image.closest(".reading-prose");
          const imageBox = image.getBoundingClientRect();
          const textBox = textBlock?.getBoundingClientRect();
          return {
            imageWidth: imageBox.width,
            textWidth: textBox?.width ?? 0,
            imageLeft: imageBox.left,
            textLeft: textBox?.left ?? 0,
            imageRight: imageBox.right,
            textRight: textBox?.right ?? 0,
          };
        }),
      );

      expect(imageLayout.length).toBeGreaterThan(0);
      for (const image of imageLayout) {
        expect(Math.abs(image.imageWidth - image.textWidth)).toBeLessThanOrEqual(1);
        expect(image.imageLeft).toBeGreaterThanOrEqual(image.textLeft - 1);
        expect(image.imageRight).toBeLessThanOrEqual(image.textRight + 1);
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    }
  });

  test("prose images leave a full line of space around adjacent content", async ({ page }) => {
    for (const width of [1366, 390]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/schule/", { waitUntil: "networkidle" });

      const spacing = await page.locator('.reading-prose img[alt="Foto-Platzhalter Mittagsverpflegung"]').evaluate((image) => {
        const paragraph = image.closest("p");
        const previousItem = paragraph?.previousElementSibling;
        const nextItem = paragraph?.nextElementSibling;
        if (!paragraph || !previousItem || !nextItem) throw new Error("The content image should have prose before and after it.");

        const imageBox = image.getBoundingClientRect();
        const fontSize = Number.parseFloat(getComputedStyle(paragraph).fontSize);
        return {
          fontSize,
          before: imageBox.top - previousItem.getBoundingClientRect().bottom,
          after: nextItem.getBoundingClientRect().top - imageBox.bottom,
        };
      });

      expect(spacing.before).toBeGreaterThanOrEqual(spacing.fontSize * 1.4);
      expect(spacing.after).toBeGreaterThanOrEqual(spacing.fontSize * 1.4);
    }
  });

  test("schule section cards link to their matching sections", async ({ page }) => {
    await page.goto("/schule/", { waitUntil: "networkidle" });

    const sectionCardSection = page.locator(".section-cards");
    await expect(sectionCardSection).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");

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
      await expect(card.locator("h2")).toHaveCSS("color", "rgb(34, 36, 119)");
      await expect(card.locator("p")).toBeVisible();
      await expect(card.locator("img")).toHaveAttribute("src", new RegExp(expected.image));
      await expect(card.locator("button")).toHaveCount(0);
    }
  });

  test("Bildreihe items respect their column limit and stay responsive without list markers", async ({ page }) => {
    await page.goto("/schule/", { waitUntil: "networkidle" });

    const layout = await page.evaluate(() => {
      const prose = document.createElement("div");
      prose.className = "reading-prose";
      const circleItems = document.createElement("div");
      circleItems.className = "circle-items";
      const grid = document.createElement("ul");
      grid.className = "circle-items-grid";
      grid.dataset.columns = "3";

      for (let index = 0; index < 8; index += 1) {
        const item = document.createElement("li");
        item.className = "circle-items-item";
        const figure = document.createElement("figure");
        figure.className = "circle-items-figure";
        const frame = document.createElement("div");
        frame.className = "circle-items-image-frame";
        const caption = document.createElement("figcaption");
        caption.className = "circle-items-caption";
        const title = document.createElement("p");
        title.className = "circle-items-title";
        title.textContent = `Teammitglied ${index + 1}`;
        caption.append(title);
        figure.append(frame, caption);
        item.append(figure);
        grid.append(item);
      }

      circleItems.append(grid);
      prose.append(circleItems);
      document.querySelector("main")?.append(prose);
      const getRowCounts = () => {
        const rowCounts = new Map<number, number>();
        [...grid.children].forEach((item) => {
          const row = Math.round(item.getBoundingClientRect().top);
          rowCounts.set(row, (rowCounts.get(row) ?? 0) + 1);
        });
        return [...rowCounts.values()];
      };
      const configuredColumns = [1, 2, 3, 4].map((maxColumns) => {
        grid.dataset.columns = String(maxColumns);
        return Math.max(...getRowCounts());
      });
      grid.dataset.columns = "3";

      const frame = grid.querySelector(".circle-items-image-frame");
      if (!frame) throw new Error("The circle item image frame should exist.");
      const frameRect = frame.getBoundingClientRect();
      const gridRect = grid.getBoundingClientRect();
      const containerRect = circleItems.getBoundingClientRect();
      const firstRowTop = grid.children[0]?.getBoundingClientRect().top;
      const lastRowTop = grid.children[grid.children.length - 1]?.getBoundingClientRect().top;
      const rowCenters = (top: number | undefined) =>
        [...grid.children]
          .filter((item) => Math.abs(item.getBoundingClientRect().top - (top ?? 0)) < 1)
          .map((item) => {
            const rect = item.getBoundingClientRect();
            return rect.left + rect.width / 2;
          });
      const firstRowCenters = rowCenters(firstRowTop);
      const lastRowCenters = rowCenters(lastRowTop);
      const rowCounts = getRowCounts();
      const gridStyle = getComputedStyle(grid);

      return {
        columns: Math.max(...rowCounts),
        configuredColumns,
        gridWidth: gridRect.width,
        containerWidth: containerRect.width,
        firstRowSpread: firstRowCenters[firstRowCenters.length - 1] - firstRowCenters[0],
        lastRowCenter: (lastRowCenters.reduce((sum, center) => sum + center, 0) / lastRowCenters.length - gridRect.left) / gridRect.width,
        listStyle: gridStyle.listStyleType,
        inlinePadding: gridStyle.paddingInlineStart,
        frameRadius: getComputedStyle(frame).borderRadius,
        frameIsSquare: Math.abs(frameRect.width - frameRect.height) < 1,
        rowCount: rowCounts.length,
        itemCount: grid.children.length,
        linkCount: grid.querySelectorAll("a").length,
      };
    });

    const isNarrow = (page.viewportSize()?.width ?? 0) < 640;
    expect(layout.columns).toBe(isNarrow ? 2 : 3);
    expect(layout.configuredColumns).toEqual(isNarrow ? [1, 2, 2, 3] : [1, 2, 3, 4]);
    expect(Math.abs(layout.gridWidth - layout.containerWidth)).toBeLessThan(1);
    expect(layout.firstRowSpread / layout.gridWidth).toBeGreaterThan(0.45);
    expect(layout.lastRowCenter).toBeCloseTo(0.5, 1);
    expect(layout.listStyle).toBe("none");
    expect(layout.inlinePadding).toBe("0px");
    expect(layout.frameRadius).toBe("50%");
    expect(layout.frameIsSquare).toBe(true);
    expect(layout.rowCount).toBe(isNarrow ? 4 : 3);
    expect(layout.itemCount).toBe(8);
    expect(layout.linkCount).toBe(0);
  });

  test("requested staff sections render eight placeholder portraits", async ({ page }) => {
    const sections = [
      { route: "/schule/", id: "schulleitung-und-team", titlePrefix: "Name ergänzen" },
      { route: "/schule/", id: "verwaltung", titlePrefix: "Name ergänzen" },
      { route: "/schule/", id: "vorstand", titlePrefix: "Vorstandsmitglied" },
      { route: "/verein/", id: "vorstand", titlePrefix: "Vorstandsmitglied" },
    ];

    for (const section of sections) {
      await page.goto(section.route, { waitUntil: "networkidle" });

      const content = page.locator(`#${section.id} + .reading-prose`);
      await expect(content.locator(".circle-items-item")).toHaveCount(8);
      await expect(content.locator('img[src*="image-placeholder.png"]')).toHaveCount(8);
      await expect(content.locator('img[alt="Platzhalterbild"]')).toHaveCount(8);
      await expect(content.locator(".circle-items-title")).toHaveCount(8);
      await expect(content.locator(".circle-items-title").first()).toHaveText(`${section.titlePrefix} 1`);
      await expect(content.locator(".circle-items-title").last()).toHaveText(`${section.titlePrefix} 8`);
      const grid = content.locator(".circle-items-grid");
      await expect(grid).toHaveAttribute("data-columns", "3");
      const maxItemsPerRow = await grid.evaluate((element) => {
        const rowCounts = new Map<number, number>();
        [...element.children].forEach((item) => {
          const row = Math.round(item.getBoundingClientRect().top);
          rowCounts.set(row, (rowCounts.get(row) ?? 0) + 1);
        });
        return Math.max(...rowCounts.values());
      });
      expect(maxItemsPerRow).toBe((page.viewportSize()?.width ?? 0) < 640 ? 2 : 3);
    }
  });

  test("enabled CMS outline uses the thin rail without legacy section TOCs", async ({ page }) => {
    await page.goto("/elternengagement/", { waitUntil: "networkidle" });

    await expect(page.locator("[data-page-outline]")).toHaveCount(1);
    await expect(page.locator(".schule-toc")).toHaveCount(0);
    await expect(page.locator("[data-mobile-toc]")).toHaveCount(0);
  });

  test("enabled CMS outline starts after the slider and tracks the active heading", async ({ page }) => {
    test.skip((page.viewportSize()?.width ?? 0) < 1100, "the desktop outline is omitted below 1100px");

    await page.goto("/elternengagement/", { waitUntil: "networkidle" });

    const outline = page.locator("[data-page-outline]");
    const outlineLinks = outline.locator("[data-page-outline-link]");
    const contentHeadings = page.locator("[data-page-outline-content] :is(h2, h3)");
    const progressMarkerDelta = () =>
      outline.evaluate((element) => {
        const currentLink = element.querySelector('[aria-current="location"]');
        const linkRect = currentLink?.getBoundingClientRect();
        const outlineRect = element.getBoundingClientRect();
        const expected = linkRect && element.clientHeight > 0 ? (linkRect.top + linkRect.height / 2 - outlineRect.top) / element.clientHeight : 0;
        const actual = Number(element.style.getPropertyValue("--page-outline-progress"));
        return Math.abs(actual - expected);
      });
    await expect(page.locator(".schule-slider")).toBeVisible();
    await expect(outline).toBeHidden();
    await page.evaluate(() => {
      const slider = document.querySelector(".schule-slider");
      const boundary = slider?.closest("section") || slider?.parentElement || slider;
      const stickyHeight = document.querySelector("[data-sticky-navigation]")?.getBoundingClientRect().height || 0;
      document.documentElement.style.scrollBehavior = "auto";
      window.scrollTo(0, (boundary?.getBoundingClientRect().bottom || 0) + window.scrollY - stickyHeight + 1);
    });
    await expect(outline).toBeVisible();
    await expect(outlineLinks.first()).toHaveAttribute("aria-current", "location");
    await expect.poll(progressMarkerDelta).toBeLessThan(0.005);
    await expect(outline.locator("[data-page-outline-title]")).toHaveText("Elternengagement");
    await expect(outlineLinks).toHaveCount(await contentHeadings.count());
    await expect(outlineLinks.filter({ hasText: /^Möglichkeiten$/ })).toHaveCount(1);
    await expect(outlineLinks.filter({ hasText: /^Weiterführende Seiten$/ })).toHaveCount(1);
    await expect(outlineLinks.first()).toHaveCSS("color", "rgba(0, 0, 0, 0)");
    const collapsedMarkerColor = await outlineLinks.first().evaluate((link) => getComputedStyle(link, "::before").backgroundColor);
    expect(collapsedMarkerColor).not.toBe("rgba(0, 0, 0, 0)");

    await page.mouse.move(16, 120);
    const sectionLink = outlineLinks.filter({ hasText: /^Möglichkeiten$/ });
    await expect(sectionLink).not.toHaveCSS("color", "rgba(0, 0, 0, 0)");
    const sectionHref = await sectionLink.getAttribute("href");
    await sectionLink.click();
    await expect.poll(() => new URL(page.url()).hash).toBe(sectionHref);
    await expect.poll(() => sectionLink.getAttribute("aria-current")).toBe("location");

    await expect.poll(progressMarkerDelta).toBeLessThan(0.005);

    await page.evaluate(() => {
      document.documentElement.style.scrollBehavior = "auto";
      window.scrollTo(0, document.documentElement.scrollHeight);
    });
    await expect(outlineLinks.last()).toHaveAttribute("aria-current", "location");
    await expect.poll(progressMarkerDelta).toBeLessThan(0.005);
  });

  test("desktop content outline reads Markdown headings and omits deeper heading levels", async ({ page }) => {
    test.skip((page.viewportSize()?.width ?? 0) < 1100, "the desktop outline is omitted below 1100px");

    await page.goto("/datenschutz/", { waitUntil: "networkidle" });

    const outline = page.locator("[data-page-outline]");
    const outlineLinks = outline.locator("[data-page-outline-link]");
    await expect(outline).toBeVisible();
    await expect(outline.locator("[data-page-outline-title]")).toHaveText("Datenschutz");
    await expect(outlineLinks.filter({ hasText: "1. Datenschutz auf einen Blick" })).toHaveCount(1);
    await expect(outlineLinks.filter({ hasText: /^2\. Hosting$/ })).toHaveCount(1);
    await expect(outlineLinks.filter({ hasText: /^Hosting$/ })).toHaveCount(0);
    await expect(outline.getByRole("link", { name: "Allgemeine Hinweise", exact: true })).toHaveCount(0);
    await expect(outlineLinks).toHaveCount(await page.locator("[data-page-outline-content] :is(h2, h3)").count());
  });

  test("the CMS outline toggle hides the thin rail when disabled", async ({ page }) => {
    await page.goto("/verein/", { waitUntil: "networkidle" });

    await expect(page.locator("[data-page-outline]")).toHaveCount(0);
    await expect(page.locator(".schule-toc")).toHaveCount(0);
    await expect(page.locator("[data-mobile-toc]")).toHaveCount(0);
  });

  test("long outline headings stay constrained and outside the content column", async ({ page }) => {
    test.skip((page.viewportSize()?.width ?? 0) < 1100, "the desktop outline is omitted below 1100px");

    const longHeading = "Verbraucherstreitbeilegung/Universalschlichtungsstelle";
    const outline = page.locator("[data-page-outline]");
    const longHeadingLink = outline.locator("[data-page-outline-link]").filter({ hasText: longHeading });

    for (const width of [1366, 1280, 1100]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/impressum/", { waitUntil: "networkidle" });
      await expect(outline).toBeVisible();
      await expect(longHeadingLink).toHaveText(longHeading);
      await expect(outline.locator("[data-page-outline-link]").filter({ hasText: /^Streitbeilegung$/ })).toHaveCount(0);

      const geometry = await page.evaluate((headingText) => {
        const link = [...document.querySelectorAll("[data-page-outline-link]")].find((element) => element.textContent?.trim() === headingText);
        const heading = [...document.querySelectorAll("[data-page-outline-content] h2")].find((element) => element.textContent?.trim() === headingText);
        if (!link || !heading) throw new Error("The outline link or matching heading is missing");

        const linkRect = link.getBoundingClientRect();
        const headingRect = heading.getBoundingClientRect();
        return { labelWidth: linkRect.width, labelRight: linkRect.right, contentLeft: headingRect.left };
      }, longHeading);

      expect(geometry.labelWidth).toBeLessThanOrEqual(192);
      expect(geometry.labelRight).toBeLessThan(geometry.contentLeft);
    }

    await page.setViewportSize({ width: 1099, height: 900 });
    await page.goto("/impressum/", { waitUntil: "networkidle" });
    await expect(outline).toBeHidden();
  });

  test("the outline rail clears school area links at 1100px", async ({ page }) => {
    test.skip((page.viewportSize()?.width ?? 0) < 1100, "the desktop outline is omitted below 1100px");

    await page.setViewportSize({ width: 1100, height: 900 });
    await page.goto("/schule/", { waitUntil: "networkidle" });

    const outline = page.locator("[data-page-outline]");
    const cardGrid = page.locator(".section-cards-grid");
    await expect(cardGrid).toHaveClass(/section-cards-grid--outlined/);
    await page.evaluate(() => {
      const slider = document.querySelector(".schule-slider");
      const boundary = slider?.closest("section") || slider?.parentElement || slider;
      const stickyHeight = document.querySelector("[data-sticky-navigation]")?.getBoundingClientRect().height || 0;
      document.documentElement.style.scrollBehavior = "auto";
      window.scrollTo(0, (boundary?.getBoundingClientRect().bottom || 0) + window.scrollY - stickyHeight + 1);
    });
    await expect(outline).toBeVisible();

    const geometry = await page.evaluate(() => {
      const aside = document.querySelector("[data-page-outline]");
      const image = document.querySelector(".section-card-image");
      const link = [...document.querySelectorAll("[data-page-outline-link]")].find((element) => element.textContent?.includes("Wie sieht ein Schultag"));
      if (!aside || !image || !link) throw new Error("The outline, section-card image, or school-day link is missing");

      return {
        railRight: aside.getBoundingClientRect().right,
        labelRight: link.getBoundingClientRect().right,
        imageLeft: image.getBoundingClientRect().left,
      };
    });

    expect(geometry.railRight).toBeLessThanOrEqual(geometry.imageLeft);
    expect(geometry.labelRight).toBeLessThan(geometry.imageLeft);
  });

  test("content outline is omitted for short pages and on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/schule/", { waitUntil: "networkidle" });
    await expect(page.locator("[data-page-outline]")).toBeHidden();

    await page.setViewportSize({ width: 1366, height: 900 });
    await page.goto("/presse/", { waitUntil: "networkidle" });
    await expect(page.locator("[data-page-outline]")).toHaveCount(0);
  });

  test("long-form content reveals in reading order as it enters the viewport", async ({ page }) => {
    await page.goto("/schule/", { waitUntil: "networkidle" });

    const revealHeading = page.locator("[data-page-outline-content] > h2").filter({ hasText: "Wer wir sind" });
    await expect(revealHeading).toHaveCount(1);
    await expect(revealHeading).toHaveAttribute("data-reveal", "");
    await expect(revealHeading).toHaveCSS("opacity", "0");

    await page.evaluate(() => {
      document.documentElement.style.scrollBehavior = "auto";
    });
    await revealHeading.scrollIntoViewIfNeeded();
    await expect(revealHeading).toHaveClass(/is-in/);
    await expect(revealHeading).toHaveCSS("opacity", "1");
    await expect(revealHeading).toHaveCSS("transform", "none");
  });

  test("long-form content stays visible when reduced motion is requested", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/schule/", { waitUntil: "networkidle" });

    const revealHeading = page.locator("[data-page-outline-content] > h2").filter({ hasText: "Wer wir sind" });
    await expect(revealHeading).toBeVisible();
    await expect(revealHeading).not.toHaveAttribute("data-reveal");
    await expect(revealHeading).toHaveCSS("opacity", "1");
  });

  test("footer places its links where the copyright was and omits the copyright", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });

    const footer = page.locator("footer");
    await expect(footer).toHaveCSS("background-color", "rgb(255, 255, 255)");
    await expect(footer).not.toContainText(/© Montessori Schule Gilching/);

    const footerSections = footer.locator(":scope > .container > .items-center > div");
    await expect(footerSections).toHaveCount(1);

    const footerImageSection = footerSections.nth(0);
    const instagramLink = footerImageSection.locator('a[aria-label="instagram"]');
    await expect(instagramLink).toBeVisible();
    await expect(instagramLink).toHaveAttribute("href", "https://www.facebook.com/");
    await expect(instagramLink.locator("i")).toHaveClass(/fa-instagram/);

    const footerImage = footerImageSection.locator("img");
    await expect(footerImage).toHaveAttribute("src", /zaun/);
    await expect(footerImage).toHaveAttribute("alt", "Bunter Zaun der Montessori Schule Gilching");
    await expect(footerImage).toHaveJSProperty("naturalWidth", 2043);
    const footerLinks = footerImageSection.locator(".footer-links");
    const firstFooterLink = footerLinks.locator("li").first();
    await expect(firstFooterLink).toContainText("Impressum");
    await expect(footerImageSection.locator("div.absolute.top-0")).toHaveCount(0);
    await expect(footerLinks.locator("p")).toHaveCount(0);

    const firstLinkBox = await firstFooterLink.boundingBox();
    const instagramBox = await instagramLink.locator("..").boundingBox();
    expect(firstLinkBox).not.toBeNull();
    expect(instagramBox).not.toBeNull();
    expect(instagramBox?.y).toBeLessThan((firstLinkBox?.y ?? 0) + (firstLinkBox?.height ?? 0));
    expect(firstLinkBox?.y).toBeLessThan((instagramBox?.y ?? 0) + (instagramBox?.height ?? 0));
    await expect(footer).toHaveCSS("padding-bottom", "32px");

    for (const width of [320, 390, 639, 640, 767, 768, 1279, 1280, 1366]) {
      await page.setViewportSize({ width, height: 900 });

      const footerLayout = await footerImageSection.evaluate((section) => {
        const image = section.querySelector("img");
        const links = section.querySelector(".footer-links");
        if (!image || !links) throw new Error("Footer image or links are missing");

        const imageBox = image.getBoundingClientRect();
        const linksBox = links.getBoundingClientRect();
        const linkItems = [...links.querySelectorAll("li")];
        const firstLink = linkItems[0];
        const lastLink = linkItems[linkItems.length - 1];
        if (!firstLink || !lastLink) throw new Error("Footer links are missing");

        const linkCenterRatios = linkItems.map((link) => {
          const linkBox = link.getBoundingClientRect();
          return (linkBox.top + linkBox.height / 2 - imageBox.top) / imageBox.height;
        });
        const style = getComputedStyle(links);
        const paddingLeft = Number.parseFloat(style.paddingLeft);
        const paddingRight = Number.parseFloat(style.paddingRight);
        const contentLeft = linksBox.left + paddingLeft;
        const contentWidth = linksBox.width - paddingLeft - paddingRight;
        const firstLinkBox = firstLink.getBoundingClientRect();
        const lastLinkBox = lastLink.getBoundingClientRect();
        const horizontalGaps = linkItems.slice(1).map((link, index) => {
          return link.getBoundingClientRect().left - linkItems[index].getBoundingClientRect().right;
        });
        const horizontalCenter = (firstLinkBox.left + lastLinkBox.right) / 2 - contentLeft;

        return { linkCenterRatios, horizontalGaps, horizontalCenterRatio: horizontalCenter / contentWidth };
      });

      expect(footerLayout.linkCenterRatios).toHaveLength(6);
      for (const ratio of footerLayout.linkCenterRatios) {
        expect(ratio).toBeGreaterThanOrEqual(0.85);
        expect(ratio).toBeLessThanOrEqual(1.01);
      }
      if (width < 768) {
        expect(footerLayout.horizontalGaps).toHaveLength(5);
        for (const gap of footerLayout.horizontalGaps) {
          expect(gap).toBeGreaterThanOrEqual(5.5);
          expect(gap).toBeLessThanOrEqual(6.5);
        }
        expect(footerLayout.horizontalCenterRatio).toBeCloseTo(0.5, 2);
      }
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

  test("breadcrumbs are absent from archives and taxonomy pages", async ({ page }) => {
    for (const route of ["/aktuelles/", "/tags/", "/tags/termin/", "/categories/"]) {
      await page.goto(route, { waitUntil: "networkidle" });
      await expect(page.locator(".breadcrumb")).toHaveCount(0);
    }
  });

  test("spenden page uses compact project cards and keeps past supporters text-first", async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 900 });
    await page.goto("/spenden/", { waitUntil: "networkidle" });

    await expect(page.locator("main > section:first-child h1.page-title-calligraphy")).toHaveText("So können Sie unsere Schule unterstützen");
    await expect(page.locator(".donation-hero h1")).toHaveCount(0);
    await expect(page.locator(".donation-project")).toHaveCount(3);
    await expect(page.locator(".past-donation-card")).toHaveCount(12);
    await expect(page.locator(".donation-hero-cta")).toHaveCount(1);
    await expect(page.locator("main a")).toHaveCount(1);
    const leadHeroImage = page.locator('.donation-hero-slider img[src*="Schuleeingang"]').first();
    const nextHeroImage = page.locator('.donation-hero-slider img[src*="Zaun_3"]').first();
    await expect(leadHeroImage).toBeVisible();
    await expect(leadHeroImage).toHaveAttribute("loading", "eager");
    await expect(leadHeroImage).toHaveAttribute("fetchpriority", "high");
    await expect(nextHeroImage).toHaveAttribute("loading", "lazy");

    const overlayStyles = await page.locator(".donation-hero-copy").evaluate((element) => {
      const styles = getComputedStyle(element);
      const cta = element.querySelector(".donation-hero-cta");
      if (!cta) throw new Error("Donation CTA is missing");
      const ctaStyles = getComputedStyle(cta);
      return {
        background: styles.backgroundColor,
        backdropFilter: styles.backdropFilter,
        borderRadius: styles.borderTopLeftRadius,
        ctaBackground: ctaStyles.backgroundColor,
        ctaColor: ctaStyles.color,
        zIndex: styles.zIndex,
      };
    });
    expect(overlayStyles.background).not.toBe("oklch(0.32008 0.13793 274.324)");
    expect(overlayStyles.backdropFilter).toContain("blur");
    expect(overlayStyles.borderRadius).toBe("12px");
    expect(overlayStyles.ctaBackground).not.toBe("oklch(0.99 0 none)");
    expect(overlayStyles.ctaColor).toBe("oklch(0.32008 0.13793 274.324)");
    expect(Number(overlayStyles.zIndex)).toBeGreaterThan(1);

    await expect(page.locator(".donation-section-heading p")).toHaveCount(0);
    await expect(page.locator(".past-donations-heading p")).toHaveCount(0);
    const pastSectionBackground = await page.locator(".past-donations").evaluate((section) => getComputedStyle(section).backgroundColor);
    expect(pastSectionBackground).toBe("rgba(0, 0, 0, 0)");

    const sectionOrder = await page.locator("main > section").evaluateAll((elements) => elements.map((element) => element.classList[0]));
    expect(sectionOrder[0]).toBe("container");
    expect(sectionOrder.slice(1)).toEqual(["donation-hero", "donation-projects", "past-donations"]);

    const headingLayout = await page.locator(".donation-section-heading h2, .past-donations-heading h2").evaluateAll((headings) =>
      headings.map((heading) => {
        const styles = getComputedStyle(heading);
        return {
          whiteSpace: styles.whiteSpace,
          fontSize: Number.parseFloat(styles.fontSize),
          height: heading.getBoundingClientRect().height,
          lineHeight: Number.parseFloat(styles.lineHeight),
        };
      }),
    );
    expect(headingLayout).toHaveLength(2);
    for (const heading of headingLayout) {
      expect(heading.whiteSpace).toBe("nowrap");
      expect(heading.fontSize).toBeLessThanOrEqual(30);
      expect(heading.height).toBeLessThanOrEqual(heading.lineHeight + 1);
    }

    const projectLayout = await page.locator(".donation-project-list").evaluate((grid) => {
      const cards = [...grid.querySelectorAll(".donation-project")];
      const firstCard = cards[0];
      const secondCard = cards[1];
      const lastCard = cards.at(-1);
      const media = firstCard?.querySelector(".donation-project-media");
      const title = firstCard?.querySelector(".donation-project-copy h3");
      const content = firstCard?.querySelector(".donation-project-content");
      if (!firstCard || !secondCard || !lastCard || !media || !title || !content) throw new Error("Project cards are incomplete");

      const firstBox = firstCard.getBoundingClientRect();
      const secondBox = secondCard.getBoundingClientRect();
      const lastBox = lastCard.getBoundingClientRect();
      return {
        columns: getComputedStyle(grid).gridTemplateColumns.trim().split(/\s+/).length,
        gridWidth: grid.getBoundingClientRect().width,
        cardsShareFirstRow: Math.abs(firstBox.top - secondBox.top) < 1,
        lastCardSharesFirstRow: Math.abs(firstBox.top - lastBox.top) < 1,
        cardWidth: firstBox.width,
        mediaHeight: media.getBoundingClientRect().height,
        mediaAspectRatio: getComputedStyle(media).aspectRatio,
        cardBorderStyle: getComputedStyle(firstCard).borderTopStyle,
        cardBorderRadius: getComputedStyle(firstCard).borderTopLeftRadius,
        cardShadow: getComputedStyle(firstCard).boxShadow,
        titleSize: Number.parseFloat(getComputedStyle(title).fontSize),
        contentSize: Number.parseFloat(getComputedStyle(content).fontSize),
      };
    });

    expect(projectLayout.columns).toBe(3);
    expect(projectLayout.cardsShareFirstRow).toBe(true);
    expect(projectLayout.lastCardSharesFirstRow).toBe(true);
    expect(projectLayout.cardWidth).toBeLessThan(400);
    expect(projectLayout.mediaHeight).toBeLessThan(300);
    expect(projectLayout.mediaAspectRatio).toBe("4 / 3");
    expect(projectLayout.cardBorderStyle).toBe("solid");
    expect(projectLayout.cardBorderRadius).toBe("12px");
    expect(projectLayout.cardShadow).not.toBe("none");
    expect(projectLayout.titleSize).toBe(20);
    expect(projectLayout.contentSize).toBe(16);

    const desktopLayout = await page
      .locator(".past-donation-card")
      .first()
      .evaluate((card) => {
        const media = card.querySelector(".past-donation-media");
        const copy = card.querySelector(".past-donation-copy");
        const image = media?.querySelector("img");
        return {
          gridWidth: card.parentElement?.getBoundingClientRect().width ?? 0,
          mediaWidth: media?.getBoundingClientRect().width ?? 0,
          copyWidth: copy?.getBoundingClientRect().width ?? 0,
          objectFit: image ? getComputedStyle(image).objectFit : "",
        };
      });

    expect(desktopLayout.gridWidth).toBeGreaterThan(projectLayout.gridWidth + 50);
    expect(desktopLayout.mediaWidth).toBeLessThanOrEqual(112);
    expect(desktopLayout.copyWidth).toBeGreaterThan(desktopLayout.mediaWidth * 2.5);
    expect(desktopLayout.objectFit).toBe("contain");

    await page.setViewportSize({ width: 1100, height: 900 });
    const midWidthCopyAlignment = await page
      .locator(".past-donation-card")
      .first()
      .evaluate((card) => {
        const title = card.querySelector(".past-donation-copy h3");
        const content = card.querySelector(".past-donation-content");
        if (!title || !content) throw new Error("Past-donation text is incomplete");
        return Math.abs(title.getBoundingClientRect().left - content.getBoundingClientRect().left);
      });
    expect(midWidthCopyAlignment).toBeLessThanOrEqual(1);

    for (const width of [1366, 1100, 390]) {
      await page.setViewportSize({ width, height: 900 });
      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      expect(scrollWidth).toBeLessThanOrEqual(width);
      if (width === 390) {
        const columns = await page.locator(".donation-project-list").evaluate((grid) => getComputedStyle(grid).gridTemplateColumns.trim().split(/\s+/).length);
        expect(columns).toBe(1);

        const donorCardLayout = await page
          .locator(".past-donation-card")
          .first()
          .evaluate((card) => {
            const media = card.querySelector(".past-donation-media");
            const copy = card.querySelector(".past-donation-copy");
            if (!media || !copy) throw new Error("Past-donation card is incomplete");
            const mediaBox = media.getBoundingClientRect();
            const copyBox = copy.getBoundingClientRect();
            return {
              columns: getComputedStyle(card).gridTemplateColumns.trim().split(/\s+/).length,
              mediaWidth: mediaBox.width,
              mediaBottom: mediaBox.bottom,
              copyWidth: copyBox.width,
              copyTop: copyBox.top,
            };
          });
        expect(donorCardLayout.columns).toBe(1);
        expect(donorCardLayout.mediaWidth).toBeLessThanOrEqual(64);
        expect(donorCardLayout.copyWidth).toBeGreaterThan(donorCardLayout.mediaWidth * 3);
        expect(donorCardLayout.copyTop).toBeGreaterThanOrEqual(donorCardLayout.mediaBottom);
      }
    }
  });
});
