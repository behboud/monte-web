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
      { route: "/spenden/", selector: ".spenden-card-content" },
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
    for (const route of ["/schule/", "/elternengagement/", "/spenden/", "/foerderer/", "/verein/", "/speiseplan/"]) {
      await page.goto(route, { waitUntil: "networkidle" });

      const title = page.locator("h1.page-title-calligraphy");
      const slider = page.locator(".schule-slider").first();
      const content = page.locator(".schule-content, .spenden-cta-bar, .spenden-grid, .speiseplan-week").first();
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

  test("area-link images can be shown as full-width, centered section banners", async ({ page }) => {
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
          if (!banner || !image || !heading) throw new Error("The banner or its section heading is missing.");
          return {
            viewportWidth: document.documentElement.clientWidth,
            bannerWidth: banner.getBoundingClientRect().width,
            bannerHeight: banner.getBoundingClientRect().height,
            imageWidth: image.getBoundingClientRect().width,
            imageHeight: image.getBoundingClientRect().height,
            bannerTop: banner.getBoundingClientRect().top,
            headingTop: heading.getBoundingClientRect().top,
          };
        }, expected.id);

        expect(bannerLayout.bannerWidth).toBe(bannerLayout.viewportWidth);
        expect(bannerLayout.imageWidth).toBe(bannerLayout.viewportWidth);
        expect(bannerLayout.imageHeight).toBe(sliderBox.height);
        expect(bannerLayout.bannerHeight).toBe(sliderBox.height);
        expect(bannerLayout.bannerTop).toBeLessThan(bannerLayout.headingTop);
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    }
  });

  test("content images stay within the text measure on desktop and mobile", async ({ page }) => {
    for (const width of [1366, 390]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/schule/", { waitUntil: "networkidle" });

      const imageLayout = await page.locator(".schule-content .reading-prose img:not(.section-banner-image)").evaluateAll((images) =>
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

  test("section TOCs are hidden by default", async ({ page }) => {
    await page.goto("/schule/", { waitUntil: "networkidle" });

    await expect(page.locator(".schule-toc")).toHaveCount(0);
    await expect(page.locator("[data-mobile-toc]")).toHaveCount(0);
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
