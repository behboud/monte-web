import { expect, test } from "@playwright/test";

test.describe("Bildkarussell", () => {
  test("renders manual carousels in the Schultag and Mittagsverpflegung sections", async ({ page }) => {
    await page.goto("/schule/", { waitUntil: "networkidle" });

    const schultag = page.locator('h3#wie-sieht-ein-schultag-bei-uns-aus + .reading-prose > .image-carousel');
    const mittag = page.locator('h3#mittagsverpflegung + .reading-prose .image-carousel');
    await expect(schultag).toHaveCount(1);
    await expect(mittag).toHaveCount(1);
    await expect(schultag.locator(".swiper-slide")).toHaveCount(12);
    await expect(mittag.locator(".swiper-slide")).toHaveCount(6);
    await expect(page.locator('.reading-prose img[alt="Foto-Platzhalter Mittagsverpflegung"]')).toHaveCount(0);

    for (const carousel of [schultag, mittag]) {
      await expect(carousel.locator(".swiper-pagination-bullet")).toHaveCount(0);
      await expect(carousel.getByRole("button", { name: "Vorheriges Bild" })).toBeVisible();
      await expect(carousel.getByRole("button", { name: "Nächstes Bild" })).toBeVisible();

      const ratio = await carousel.locator(".swiper-slide").first().evaluate((slide) => {
        const box = slide.getBoundingClientRect();
        return box.width / box.height;
      });
      expect(ratio).toBeCloseTo(1.5, 1);
    }

    const widths = await mittag.evaluate((carousel) => ({
      carousel: carousel.getBoundingClientRect().width,
      prose: carousel.closest(".reading-prose")?.getBoundingClientRect().width ?? 0,
    }));
    expect(Math.abs(widths.carousel - widths.prose)).toBeLessThanOrEqual(1);
  });

  test("does not autoplay and advances with the next button", async ({ page }) => {
    await page.goto("/schule/", { waitUntil: "networkidle" });

    const carousel = page.locator("h3#mittagsverpflegung + .reading-prose .image-carousel");
    await carousel.scrollIntoViewIfNeeded();
    const firstSlide = carousel.locator(".swiper-slide").nth(0);
    const secondSlide = carousel.locator(".swiper-slide").nth(1);
    await expect(firstSlide).toHaveClass(/swiper-slide-active/);

    await page.waitForTimeout(6000);
    await expect(firstSlide).toHaveClass(/swiper-slide-active/);

    await carousel.getByRole("button", { name: "Nächstes Bild" }).click();
    await expect(secondSlide).toHaveClass(/swiper-slide-active/);
    await expect(firstSlide).not.toHaveClass(/swiper-slide-active/);
  });
});

test.describe("Bildkarussell CMS component", () => {
  test("is enabled in the rich text editor and round-trips its images", async ({ page, request }) => {
    const configResponse = await request.get("/admin/config.yml");
    const config = await configResponse.text();
    expect(config).toMatch(/editor_components: \[[^\]]*\bimage-carousel\b[^\]]*\]/);

    await page.goto("/");
    await page.evaluate(() => {
      Reflect.set(window, "__registeredComponents", {});
      Reflect.set(window, "CMS", {
        registerEditorComponent(component: { id: string }) {
          Reflect.get(window, "__registeredComponents")[component.id] = component;
        },
      });
    });
    await page.addScriptTag({ url: "/admin/editor-components.js" });

    const result = await page.evaluate(() => {
      type CarouselItem = { image: string; alt: string };
      type CarouselComponent = {
        id: string;
        label: string;
        fields: Array<{ name: string; max?: number; fields?: Array<{ name: string; required?: boolean; hint?: string }> }>;
        pattern: RegExp;
        toBlock: (data: { items: CarouselItem[] }) => string;
        fromBlock: (match: RegExpMatchArray | null) => { items: CarouselItem[] };
        toPreview: (data: { items: CarouselItem[] }, getAsset: (path: string) => { url: string }) => HTMLElement;
      };
      const components = Reflect.get(window, "__registeredComponents") as Record<string, CarouselComponent>;
      const component = components["image-carousel"];
      const items: CarouselItem[] = Array.from({ length: 25 }, (_, index) => ({
        image: `/images/foto-${index + 1}.webp`,
        alt: index === 0 ? 'Kinder & Küche "Mittag"' : "",
      }));
      const block = component.toBlock({ items });
      const parsed = component.fromBlock(block.match(component.pattern));
      const itemsField = component.fields.find((field) => field.name === "items");
      const imageField = itemsField?.fields?.find((field) => field.name === "image");
      const altField = itemsField?.fields?.find((field) => field.name === "alt");
      const preview = component.toPreview({ items: parsed.items }, (url) => ({ url }));

      return {
        id: component.id,
        label: component.label,
        max: itemsField?.max,
        imageRequired: imageField?.required,
        imageHint: imageField?.hint,
        altRequired: altField?.required,
        blockMatches: component.pattern.test(block),
        count: parsed.items.length,
        firstAlt: parsed.items[0]?.alt,
        secondAlt: parsed.items[1]?.alt,
        lastImage: parsed.items[parsed.items.length - 1]?.image,
        previewImages: preview.querySelectorAll("img").length,
        circleItemsRegistered: "circle-items" in components,
      };
    });

    expect(result).toEqual({
      id: "image-carousel",
      label: "Bildkarussell",
      max: 24,
      imageRequired: true,
      imageHint: "Bitte vor der Veröffentlichung Bildrechte und die Einwilligung erkennbarer Personen prüfen.",
      altRequired: false,
      blockMatches: true,
      count: 24,
      firstAlt: 'Kinder & Küche "Mittag"',
      secondAlt: "",
      lastImage: "/images/foto-24.webp",
      previewImages: 24,
      circleItemsRegistered: true,
    });
  });

  test("school page content round-trips through the CMS component unchanged", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => {
      Reflect.set(window, "CMS", {
        registerEditorComponent(component: { id: string }) {
          if (component.id === "image-carousel") Reflect.set(window, "__carousel", component);
        },
      });
    });
    await page.addScriptTag({ url: "/admin/editor-components.js" });

    const fs = await import("node:fs/promises");
    const content = await fs.readFile("content/de/schule/_index.md", "utf8");
    const blocks = content.match(/\{\{<\s*image-carousel[^\n]*>\}\}/g) ?? [];
    expect(blocks).toHaveLength(2);

    const roundTripped = await page.evaluate((sources) => {
      const component = Reflect.get(window, "__carousel") as {
        pattern: RegExp;
        fromBlock: (match: RegExpMatchArray | null) => { items: unknown[] };
        toBlock: (data: { items: unknown[] }) => string;
      };
      return sources.map((source) => component.toBlock(component.fromBlock(source.match(component.pattern))));
    }, blocks);
    expect(roundTripped).toEqual(blocks);
  });
});
