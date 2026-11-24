import { expect, test } from "@playwright/test";

test.describe("CMS admin", () => {
  test("loads the pinned Sveltia CMS in the German browser locale", async ({ page, request }) => {
    const configResponse = await request.get("/admin/config.yml");
    await expect(configResponse).toBeOK();
    const config = await configResponse.text();
    expect(config).toMatch(/collections:/);
    expect(config).toContain("$schema=https://unpkg.com/@sveltia/cms@0.227.2/schema/sveltia-cms.json");

    await page.goto("/admin/", { waitUntil: "domcontentloaded" });

    const cmsScript = page.locator('script[src*="@sveltia/cms@"]');
    const editorComponentsScript = page.locator('script[src="./editor-components.js"]');
    await expect(cmsScript).toHaveCount(1);
    await expect(cmsScript).toHaveAttribute("src", "https://unpkg.com/@sveltia/cms@0.227.2/dist/sveltia-cms.js");
    await expect(editorComponentsScript).toHaveCount(1);
    await expect(page.getByRole("button", { name: /Mit .*GitHub.* anmelden/i })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(/Sveltia CMS/)).toBeVisible();
  });

  test("page navigation uses front matter and custom links live with the contact page", async ({ request }) => {
    const configResponse = await request.get("/admin/config.yml");
    const config = await configResponse.text();

    expect(config).not.toMatch(/^  - name: "menus"$/m);
    expect(config).not.toContain('file: "data/menus.yaml"');
    expect(config).toContain('  - name: "top_menu"\n    label: "Top-Menü"');

    const footerStart = config.indexOf('  - name: "footer"');
    const speiseplanStart = config.indexOf('  - name: "speiseplan"', footerStart);
    expect(footerStart).toBeGreaterThanOrEqual(0);
    expect(speiseplanStart).toBeGreaterThan(footerStart);

    const footerConfig = config.slice(footerStart, speiseplanStart);
    expect(footerConfig).toContain('label: "Footer"');
    expect(footerConfig).toContain('folder: "content/de/pages"');
    expect(footerConfig).toContain("create: true");
    expect(footerConfig).toContain("default: [footer]");
    expect(footerConfig).toContain('name: "menus"');
    expect(footerConfig).toContain('name: "navigation_links"');
    expect(footerConfig).toContain('name: "menu"');
    expect(footerConfig).toContain('name: "menu_icon"');
  });

  test("Bildreihe round-trips items and its configurable row limit", async ({ page, request }) => {
    const configResponse = await request.get("/admin/config.yml");
    const config = await configResponse.text();
    expect(config).toContain("editor_components: [code-block, image, circle-items, image-carousel]");
    expect(config).not.toMatch(/^\s*comment:/m);

    const componentResponse = await request.get("/admin/editor-components.js");
    await expect(componentResponse).toBeOK();

    await page.goto("/");
    await page.evaluate(() => {
      Reflect.set(window, "CMS", {
        registerEditorComponent(component: unknown) {
          Reflect.set(window, "__registeredCircleItems", component);
        },
      });
    });
    await page.addScriptTag({ url: "/admin/editor-components.js" });

    const result = await page.evaluate(() => {
      type CircleItem = { image: string; title: string; subtitle: string; alt: string };
      type CircleComponent = {
        id: string;
        fields: Array<{ name: string; max?: number; default?: string; options?: string[] }>;
        pattern: RegExp;
        toBlock: (data: { items: CircleItem[]; columns?: string | number }) => string;
        fromBlock: (match: RegExpMatchArray | null) => { items: CircleItem[]; columns: string };
        toPreview: (data: { items: CircleItem[]; columns?: string | number }, getAsset: (path: string) => { url: string }) => HTMLElement;
      };
      const component = Reflect.get(window, "__registeredCircleItems") as CircleComponent;
      const items: CircleItem[] = [
        { image: "/images/team-1.webp", title: 'Mädchen & Jungen "Montessori"', subtitle: "Lernbegleitung", alt: "Teammitglied 1" },
        ...Array.from({ length: 23 }, (_, index) => ({
          image: `/images/team-${index + 2}.webp`,
          title: `Teammitglied ${index + 2}`,
          subtitle: "Pädagogik",
          alt: `Teammitglied ${index + 2}`,
        })),
        { image: "/images/team-25.webp", title: "Nicht übernehmen", subtitle: "Zu viel", alt: "Teammitglied 25" },
      ];
      const block = component.toBlock({ items });
      const parsed = component.fromBlock(block.match(component.pattern));
      const legacy = component.fromBlock(block.replace(/ columns="3"/, "").match(component.pattern));
      const custom = component.fromBlock(component.toBlock({ items, columns: "4" }).match(component.pattern));
      const columnField = component.fields.find((field) => field.name === "columns");
      const preview = component.toPreview({ items: parsed.items, columns: parsed.columns }, (url) => ({ url }));

      return {
        id: component.id,
        max: component.fields.find((field) => field.name === "items")?.max,
        columnsDefault: columnField?.default,
        columnsOptions: columnField?.options,
        defaultColumns: parsed.columns,
        legacyColumns: legacy.columns,
        customColumns: custom.columns,
        previewInlineSize: preview.style.inlineSize,
        previewDistributesRows: preview.style.justifyContent === "space-evenly",
        previewUsesFlexWrap: preview.style.flexWrap === "wrap",
        count: parsed.items.length,
        firstTitle: parsed.items[0]?.title,
        lastTitle: parsed.items[parsed.items.length - 1]?.title,
        previewImages: preview.querySelectorAll("img").length,
        previewHasScript: Boolean(preview.querySelector("script")),
      };
    });

    expect(result).toEqual({
      id: "circle-items",
      max: 24,
      columnsDefault: "3",
      columnsOptions: ["1", "2", "3", "4"],
      defaultColumns: "3",
      legacyColumns: "3",
      customColumns: "4",
      previewInlineSize: "100%",
      previewDistributesRows: true,
      previewUsesFlexWrap: true,
      count: 24,
      firstTitle: 'Mädchen & Jungen "Montessori"',
      lastTitle: "Teammitglied 24",
      previewImages: 24,
      previewHasScript: false,
    });
  });

  test("section pages offer optional area-link banners without per-heading images", async ({ request }) => {
    const configResponse = await request.get("/admin/config.yml");
    const config = await configResponse.text();
    const schoolStart = config.indexOf('file: "content/de/schule/_index.md"');
    const nextPage = config.indexOf('file: "content/de/elternengagement/_index.md"', schoolStart);

    expect(schoolStart).toBeGreaterThanOrEqual(0);
    expect(nextPage).toBeGreaterThan(schoolStart);

    const schoolConfig = config.slice(schoolStart, nextPage);
    expect(schoolConfig).toContain('label: "Bild für den Bereichslink"');
    expect(schoolConfig).toContain('name: "show_banner"');
    expect(schoolConfig).not.toContain('name: "content_layout"');
    expect(schoolConfig).not.toContain('name: "image_position"');
    expect(schoolConfig.match(/name: "image"/g) ?? []).toHaveLength(2);

    const areaLinkSchemas = config.match(/name: "section_cards"/g) ?? [];
    const bannerSwitches = config.match(/name: "show_banner"/g) ?? [];
    expect(areaLinkSchemas).toHaveLength(4);
    expect(bannerSwitches).toHaveLength(areaLinkSchemas.length);

    const tocSchemas = [...config.matchAll(/- label: "Inhalt"\s+name: "toc"[\s\S]*?(?=\n {10}- (?:label|\{)|\n {6}- file:|$)/g)].map(([schema]) => schema);
    expect(tocSchemas).toHaveLength(3);
    for (const tocSchema of tocSchemas) {
      expect(tocSchema).toContain('label: "Seitenübersicht anzeigen"');
      expect(tocSchema).not.toContain('name: "image"');
      expect(tocSchema).not.toContain('name: "label"');
      expect(tocSchema).not.toContain('default: "Seitenübersicht"');
    }
    expect(tocSchemas.filter((tocSchema) => tocSchema.includes('name: "sections"'))).toHaveLength(3);
    expect(config).not.toContain('label: "Seitenübersicht (ein TOC)"');
  });

  test("optimizes uploaded images before storing them", async ({ request }) => {
    const configResponse = await request.get("/admin/config.yml");
    const config = await configResponse.text();

    expect(config).toMatch(/media_libraries:\s+all:\s+transformations:\s+raster_image:\s+format: webp\s+quality: 82\s+width: 2048\s+height: 2048/);
    expect(config).toContain("optimize: true");
  });

  test("site settings manage the title logo image, position and size", async ({ request }) => {
    const configResponse = await request.get("/admin/config.yml");
    const config = await configResponse.text();

    const settingsStart = config.indexOf('  - name: "site_settings"');
    const aktuellesStart = config.indexOf('  - name: "aktuelles"', settingsStart);
    const settingsConfig = config.slice(settingsStart, aktuellesStart);

    expect(settingsConfig).toContain('file: "data/title_logo.yml"');
    expect(settingsConfig).toMatch(/name: "image", widget: "image"/);
    expect(settingsConfig).toMatch(/name: "alt", widget: "string"/);
    expect(settingsConfig).toContain('{ label: "Rechts neben dem Titel", value: "right" }');
    expect(settingsConfig).toContain('{ label: "Links neben dem Titel", value: "left" }');
    expect(settingsConfig).toContain('{ label: "Über dem Titel", value: "above" }');
    expect(settingsConfig).toContain('{ label: "Unter dem Titel", value: "below" }');
    expect(settingsConfig).toMatch(/name: "size", widget: "number", value_type: "int", min: 50, max: 200/);
    expect(settingsConfig).toMatch(/name: "offset", widget: "title-logo-offset"/);

    const adminResponse = await request.get("/admin/");
    expect(await adminResponse.text()).toContain('<script src="./title-logo-editor.js"></script>');
  });

  test("title logo preview page renders the real title row without being indexed", async ({ request }) => {
    const previewResponse = await request.get("/admin/title-logo-preview/");
    await expect(previewResponse).toBeOK();
    const previewHtml = await previewResponse.text();
    expect(previewHtml).toMatch(/<meta name="?robots"? content="noindex, nofollow"/);
    expect(previewHtml).toContain("page-title-row");
    expect(previewHtml).toContain("title-logo");

    const sitemapResponse = await request.get("/sitemap.xml");
    expect(await sitemapResponse.text()).not.toContain("title-logo-preview");
  });

  test("title logo preview applies unsaved settings and turns dragging into an offset", async ({ page }) => {
    await page.goto("/admin/title-logo-preview/", { waitUntil: "networkidle" });
    await page.addScriptTag({ url: "/admin/title-logo-editor.js" });

    const row = page.locator(".page-title-row");
    const logo = row.locator(".title-logo");
    const title = row.locator("h1");

    await page.evaluate(() => {
      const preview = Reflect.get(window, "MonteTitleLogoPreview");
      preview.applySettings(document, { position: "left", size: 150, offset: { x: 0, y: 0 }, title: "Ein Beispieltitel" });
      preview.attachDrag(document, {
        getOffset: () => ({ x: 0, y: 0 }),
        onCommit: (offset: unknown) => Reflect.set(window, "__committedOffset", offset),
      });
    });

    await expect(title).toHaveText("Ein Beispieltitel");
    await expect(row).toHaveAttribute("data-logo-position", "left");
    const fontSize = await row.evaluate((element) => Number.parseFloat(getComputedStyle(element).fontSize));
    const startBox = (await logo.boundingBox())!;
    expect(startBox.height / fontSize).toBeCloseTo(1.5, 2);
    expect(startBox.x + startBox.width).toBeLessThanOrEqual((await title.boundingBox())!.x + 1);

    const startX = startBox.x + startBox.width / 2;
    const startY = startBox.y + startBox.height / 2;
    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(startX + fontSize * 0.5, startY - fontSize * 0.25, { steps: 5 });
    await page.mouse.up();

    const committed = await page.evaluate(() => Reflect.get(window, "__committedOffset"));
    expect(committed.x).toBeCloseTo(0.5, 1);
    expect(committed.y).toBeCloseTo(-0.25, 1);
    const endBox = (await logo.boundingBox())!;
    expect(endBox.x - startBox.x).toBeCloseTo(fontSize * committed.x, 0);
    expect(endBox.y - startBox.y).toBeCloseTo(fontSize * committed.y, 0);

    const normalized = await page.evaluate(() =>
      Reflect.get(window, "MonteTitleLogoPreview").normalizeOffset({ x: 5, y: "-0.123" }),
    );
    expect(normalized).toEqual({ x: 2, y: -0.12 });
  });

  test("CMS logo uses an opaque anniversary logo", async ({ request }) => {
    const configResponse = await request.get("/admin/config.yml");
    const config = await configResponse.text();
    const logoUrl = config.match(/^logo:\s*\n\s+src:\s*([^\n]+)$/m)?.[1]?.trim();

    expect(logoUrl).toBe("/monte-web/admin/cms-logo.png");

    const localLogoPath = logoUrl.replace(/^\/monte-web/, "");
    const logoResponse = await request.get(localLogoPath);
    expect(logoResponse).toBeOK();
    expect(logoResponse.headers()["content-type"]).toMatch(/^image\/png/);

    const logoBytes = await logoResponse.body();
    // PNG color type 2 is truecolor RGB without an alpha channel.
    expect(logoBytes[25]).toBe(2);
  });

  test("CMS serves a local favicon instead of falling back to the domain root", async ({ request }) => {
    const adminResponse = await request.get("/admin/");
    const adminHtml = await adminResponse.text();

    expect(adminHtml).toContain('<link rel="icon" href="./favicon.png" type="image/png" />');
    expect(adminHtml).toContain('<link rel="shortcut icon" href="./favicon.png" type="image/png" />');

    const faviconResponse = await request.get("/admin/favicon.png");
    expect(faviconResponse).toBeOK();
    expect(faviconResponse.headers()["content-type"]).toMatch(/^image\/png/);
  });

  test("documents publication review without changing public content", async ({ page, request }) => {
    const configResponse = await request.get("/admin/config.yml");
    const config = await configResponse.text();

    expect(config).toContain('name: "publication_review"');
    expect(config).toContain("Interne Prüfinformation");
    expect(config).toContain('type: "date"');
    expect(config).toContain("Bitte vor der Veröffentlichung");
    expect(config).toContain('label: "Spenden & Förderprojekte"');
    expect(config).toContain('name: "spenden_cta"');
    expect(config).toContain('name: "projekte"');
    expect(config).toContain('label: "Im Förderhinweis anzeigen"');
    expect(config).toContain('name: "highlight"');
    expect(config).toContain('label: "Ziel des Förderhinweises"');
    expect(config).toContain("Logos bleiben bewusst klein");
    expect(config).not.toContain('name: "foerderer"');

    await page.goto("/spenden/", { waitUntil: "networkidle" });
    await expect(page.getByText("Merck-Fink-Stiftung", { exact: true })).toBeVisible();
  });
});
