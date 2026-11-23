import { expect, test, type Page } from "@playwright/test";

// Geometry helpers installed into every page. They look at real text layout
// (per-character client rects) so that broken words, stacked letters and text
// that leaves the viewport are detected the same way in Chromium and WebKit.
const installRenderingHelpers = async (page: Page) => {
  await page.addInitScript(() => {
    const isRendered = (element: Element | null) => {
      if (!element) return false;
      if (element.closest("[aria-hidden='true'], .sr-only, .mm-menu, script, style, noscript, dialog:not([open])")) return false;
      const style = getComputedStyle(element);
      if (style.display === "none" || style.visibility === "hidden") return false;
      const rect = element.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    };

    const textNodes = (root: Element) => {
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      const nodes: Text[] = [];
      let node: Node | null;
      while ((node = walker.nextNode())) {
        if (node.textContent?.trim() && isRendered(node.parentElement)) nodes.push(node as Text);
      }
      return nodes;
    };

    const charTop = (node: Text, index: number) => {
      const range = document.createRange();
      range.setStart(node, index);
      range.setEnd(node, index + 1);
      // At a hyphenation break Chromium also reports the inserted hyphen on the previous line; the glyph itself is the last rect.
      const rect = [...range.getClientRects()].filter((r) => r.width > 0).at(-1);
      return rect ? rect.top : null;
    };

    (window as unknown as { __rr: unknown }).__rr = {
      // Splits every word into its rendered line fragments.
      wordFragments(selector: string) {
        const result: { word: string; fragments: string[] }[] = [];
        document.querySelectorAll(selector).forEach((root) => {
          textNodes(root).forEach((node) => {
            const text = node.textContent || "";
            for (const match of text.matchAll(/[\p{L}\p{N}]+/gu)) {
              const start = match.index ?? 0;
              const fragments: string[] = [];
              let currentTop: number | null = null;
              for (let i = 0; i < match[0].length; i += 1) {
                const top = charTop(node, start + i);
                if (top === null) continue;
                if (currentTop === null || Math.abs(top - currentTop) > 2) {
                  fragments.push("");
                  currentTop = top;
                }
                fragments[fragments.length - 1] += match[0][i];
              }
              if (fragments.length > 1) result.push({ word: match[0], fragments });
            }
          });
        });
        return result;
      },
      lineCount(selector: string) {
        const element = document.querySelector(selector);
        if (!element) throw new Error(`${selector} is missing`);
        const tops = new Set<number>();
        textNodes(element).forEach((node) => {
          for (let i = 0; i < (node.textContent || "").length; i += 1) {
            const top = charTop(node, i);
            if (top !== null) tops.add(Math.round(top / 4));
          }
        });
        return tops.size;
      },
      // Words whose rendered box leaves the given container (default: viewport).
      wordsOutside(selector: string, containerSelector?: string) {
        const viewportWidth = document.documentElement.clientWidth;
        const outside: string[] = [];
        document.querySelectorAll(selector).forEach((root) => {
          const container = containerSelector ? root.closest(containerSelector) || document.querySelector(containerSelector) : null;
          const bounds = container ? container.getBoundingClientRect() : { left: 0, right: viewportWidth };
          textNodes(root).forEach((node) => {
            const text = node.textContent || "";
            for (const match of text.matchAll(/\S+/g)) {
              const range = document.createRange();
              range.setStart(node, match.index ?? 0);
              range.setEnd(node, (match.index ?? 0) + match[0].length);
              const rect = range.getBoundingClientRect();
              if (!rect.width) continue;
              if (rect.right > bounds.right + 1 || rect.left < bounds.left - 1) {
                outside.push(`${match[0]} [${Math.round(rect.left)}..${Math.round(rect.right)} / ${Math.round(bounds.left)}..${Math.round(bounds.right)}]`);
              }
            }
          });
        });
        return outside;
      },
    };
  });
};

type RenderingHelpers = {
  wordFragments(selector: string): { word: string; fragments: string[] }[];
  lineCount(selector: string): number;
  wordsOutside(selector: string, containerSelector?: string): string[];
};

const rr = <K extends keyof RenderingHelpers>(page: Page, method: K, ...args: string[]) =>
  page.evaluate(({ method, args }) => (window as any).__rr[method](...args), { method, args }) as Promise<ReturnType<RenderingHelpers[K]>>;

const shortFragments = (fragments: { word: string; fragments: string[] }[], minLength: number) =>
  fragments.filter((entry) => entry.fragments.some((fragment) => fragment.length < minLength)).map((entry) => `${entry.word} -> ${entry.fragments.join(" | ")}`);

// fonts.ready can resolve before a web font load has started, so request the faces explicitly.
const waitForFonts = (page: Page) =>
  page.evaluate(async () => {
    await Promise.all([document.fonts.load('400 1em "Playfair Display"'), document.fonts.load('400 1em Overpass'), document.fonts.load('600 1em Overpass')]);
    await document.fonts.ready;
  });

const scaleText = (page: Page, percent: number) => page.addStyleTag({ content: `html { font-size: ${percent}% !important; }` });

const dismissDonationPopup = (page: Page) =>
  page.addInitScript(() => {
    try {
      window.sessionStorage.setItem("monte-donation-highlight-dismissed", "true");
    } catch {
      // ignore
    }
  });

const expectNoHorizontalOverflow = async (page: Page, label: string) => {
  const { scrollWidth, clientWidth } = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(scrollWidth, `${label}: page must not scroll horizontally`).toBeLessThanOrEqual(clientWidth);
};

const intersects = (a: DOMRectLike, b: DOMRectLike) => Math.min(a.right, b.right) - Math.max(a.left, b.left) > 0.5 && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 0.5;
type DOMRectLike = { left: number; right: number; top: number; bottom: number };

const popupOptionCount = (page: Page) => page.locator("[data-donation-highlight-option]").count();

const showPopupOption = (page: Page, index: number) =>
  page.evaluate((selected) => {
    document.querySelectorAll<HTMLElement>("[data-donation-highlight-option]").forEach((option, i) => {
      option.hidden = i !== selected;
      option.scrollTop = 0;
    });
  }, index);

test.describe("rendering regressions", () => {
  test.beforeEach(async ({ page }) => {
    await installRenderingHelpers(page);
  });

  for (const route of ["/aktuelles/2025-03-24-mitgliederversammlung-cms-2025/", "/aktuelles/post-1/", "/elternengagement/", "/spenden/", "/datenschutz/", "/speiseplan/", "/"]) {
    test(`page title on ${route} never strands short word fragments, also with 200% text size`, async ({ page }) => {
      await dismissDonationPopup(page);
      for (const width of [320, 390, 768, 1024, 1366, 1920]) {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(route, { waitUntil: "load" });
        await waitForFonts(page);
        const fragments = await rr(page, "wordFragments", "main h1");
        expect(shortFragments(fragments, 4), `${route} @${width}px`).toEqual([]);
      }

      for (const width of [320, 390]) {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(route, { waitUntil: "load" });
        await scaleText(page, 200);
        await waitForFonts(page);
        const fragments = await rr(page, "wordFragments", "main h1");
        expect(shortFragments(fragments, 4), `${route} @${width}px, 200% text`).toEqual([]);
        expect(await rr(page, "lineCount", "main h1"), `${route} @${width}px, 200% text`).toBeLessThanOrEqual(4);
        expect(await rr(page, "wordsOutside", "main h1"), `${route} @${width}px, 200% text`).toEqual([]);
      }
    });
  }

  test("board member captions on /verein/ do not strand single letters", async ({ page }) => {
    for (const width of [320, 360, 390, 414]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/verein/", { waitUntil: "load" });
      await waitForFonts(page);
      const fragments = await rr(page, "wordFragments", ".circle-items-title, .circle-items-subtitle");
      expect(shortFragments(fragments, 3), `/verein/ @${width}px`).toEqual([]);
    }
  });

  test("page outline labels do not strand single letters", async ({ page, isMobile }) => {
    test.skip(isMobile, "the outline rail requires a fine pointer");

    for (const width of [1100, 1180, 1280, 1366, 1920]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/impressum/", { waitUntil: "load" });
      await waitForFonts(page);
      await page.locator("[data-page-outline]").hover();
      const fragments = await rr(page, "wordFragments", ".page-outline-link, .page-outline-title");
      expect(shortFragments(fragments, 3), `/impressum/ outline @${width}px`).toEqual([]);
    }
  });

  test("donation texts never split an arrow across two lines", async ({ page }) => {
    for (const width of [320, 390, 768, 1366]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/spenden/", { waitUntil: "load" });
      await waitForFonts(page);
      const optionCount = await popupOptionCount(page);
      for (let index = 0; index < optionCount; index += 1) {
        await showPopupOption(page, index);
        const splitArrows = await page.evaluate(() => {
          const result: string[] = [];
          const roots = document.querySelectorAll(".donation-popup-option:not([hidden]) .donation-popup-description, .donation-project-content");
          roots.forEach((root) => {
            const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
            let node: Node | null;
            while ((node = walker.nextNode())) {
              const text = node.textContent || "";
              for (const match of text.matchAll(/->/g)) {
                const tops = [0, 1].map((offset) => {
                  const range = document.createRange();
                  range.setStart(node as Text, (match.index ?? 0) + offset);
                  range.setEnd(node as Text, (match.index ?? 0) + offset + 1);
                  return Math.round(range.getBoundingClientRect().top);
                });
                if (tops[0] !== tops[1]) result.push(text.slice(Math.max(0, (match.index ?? 0) - 20), (match.index ?? 0) + 20));
              }
            }
          });
          return result;
        });
        expect(splitArrows, `/spenden/ @${width}px option ${index}`).toEqual([]);
      }
    }
  });

  for (const route of ["/aktuelles/2025-03-24-mitgliederversammlung-cms-2025/", "/aktuelles/post-1/", "/aktuelles/post-2/", "/aktuelles/post-3/", "/aktuelles/post-4/"]) {
    test(`news detail page ${route} stays inside the viewport on small screens`, async ({ page }) => {
      for (const width of [320, 360, 390, 480, 640, 768, 1024]) {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(route, { waitUntil: "load" });
        await waitForFonts(page);
        await expectNoHorizontalOverflow(page, `${route} @${width}px`);
        expect(await rr(page, "wordsOutside", "main"), `${route} @${width}px`).toEqual([]);
      }
    });
  }

  test("impressum headings with long compound words stay inside the viewport", async ({ page }) => {
    for (const width of [320, 360, 390, 768]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/impressum/", { waitUntil: "load" });
      await waitForFonts(page);
      await expectNoHorizontalOverflow(page, `/impressum/ @${width}px`);
      expect(await rr(page, "wordsOutside", "main h2, main h3"), `/impressum/ @${width}px`).toEqual([]);
    }
  });

  test("news cards share one width on mobile and keep their text inside", async ({ page }) => {
    for (const route of ["/", "/aktuelles/"]) {
      for (const width of [320, 390]) {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(route, { waitUntil: "load" });
        await waitForFonts(page);
        const widths = await page.locator("main .card").evaluateAll((cards) => cards.map((card) => Math.round(card.getBoundingClientRect().width)));
        expect(widths.length, `${route} @${width}px`).toBeGreaterThan(1);
        expect(Math.max(...widths) - Math.min(...widths), `${route} @${width}px card widths ${widths.join(",")}`).toBeLessThanOrEqual(1);
      }

      for (const [width, scale] of [
        [280, 100],
        [390, 150],
        [390, 200],
      ]) {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(route, { waitUntil: "load" });
        if (scale !== 100) await scaleText(page, scale);
        await waitForFonts(page);
        await expectNoHorizontalOverflow(page, `${route} @${width}px ${scale}%`);
        expect(await rr(page, "wordsOutside", "main .card", ".card"), `${route} @${width}px ${scale}%`).toEqual([]);
      }
    }
  });

  test("contact e-mail addresses wrap inside the viewport", async ({ page }) => {
    for (const width of [280, 320, 390]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/kontakt/", { waitUntil: "load" });
      await waitForFonts(page);
      await expectNoHorizontalOverflow(page, `/kontakt/ @${width}px`);
      expect(await rr(page, "wordsOutside", 'main a[href^="mailto:"]'), `/kontakt/ @${width}px`).toEqual([]);
    }
  });

  test("content sections keep a right margin on mobile", async ({ page }) => {
    for (const route of ["/speiseplan/", "/kontakt/", "/schule/", "/datenschutz/", "/impressum/", "/verein/"]) {
      for (const width of [320, 375]) {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(route, { waitUntil: "load" });
        const sections = await page.locator("main section.container").evaluateAll((elements) =>
          elements.map((element) => {
            const rect = element.getBoundingClientRect();
            return { left: rect.left, right: rect.right, viewport: document.documentElement.clientWidth };
          }),
        );
        expect(sections.length, route).toBeGreaterThan(0);
        for (const section of sections) {
          expect(section.right, `${route} @${width}px section right edge`).toBeLessThanOrEqual(section.viewport - 12);
        }
      }
    }
  });

  for (const route of ["/schule/", "/datenschutz/", "/kontakt/", "/verein/", "/impressum/", "/elternengagement/"]) {
    test(`long words and addresses on ${route} wrap at 280px and with enlarged text`, async ({ page }) => {
      await dismissDonationPopup(page);
      for (const [width, scale] of [
        [280, 100],
        [390, 150],
        [390, 200],
      ]) {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(route, { waitUntil: "load" });
        if (scale !== 100) await scaleText(page, scale);
        await waitForFonts(page);
        await expectNoHorizontalOverflow(page, `${route} @${width}px ${scale}%`);
        expect(await rr(page, "wordsOutside", "main"), `${route} @${width}px ${scale}%`).toEqual([]);
      }
    });
  }

  test("footer links sit on an opaque band instead of the fence picture on mobile", async ({ page }) => {
    for (const [width, scale] of [
      [280, 100],
      [320, 100],
      [390, 100],
      [390, 200],
    ]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/kontakt/", { waitUntil: "load" });
      if (scale !== 100) await scaleText(page, scale);
      await waitForFonts(page);
      const result = await page.locator("footer .footer-links").evaluate((links) => {
        const band = links.getBoundingClientRect();
        const background = getComputedStyle(links).backgroundColor;
        const alpha = background.startsWith("rgba") ? Number.parseFloat(background.split(",")[3]) : background === "transparent" ? 0 : 1;
        const outside = [...links.querySelectorAll("a")].filter((link) => {
          const rect = link.getBoundingClientRect();
          return rect.top < band.top - 0.5 || rect.bottom > band.bottom + 0.5 || rect.left < band.left - 0.5 || rect.right > band.right + 0.5;
        });
        return { alpha, outside: outside.map((link) => link.textContent?.trim() || link.getAttribute("aria-label")) };
      });
      expect(result.alpha, `footer band @${width}px ${scale}%`).toBe(1);
      expect(result.outside, `footer links @${width}px ${scale}%`).toEqual([]);
    }
  });

  test("back-to-top button never covers footer links at the end of the page", async ({ page }) => {
    for (const width of [320, 375, 390]) {
      await page.setViewportSize({ width, height: 700 });
      await page.goto("/kontakt/", { waitUntil: "load" });
      await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "instant" }));
      const button = page.locator("[data-back-to-top]");
      await expect(button).toHaveAttribute("data-visible", "true");
      await page.waitForTimeout(400);
      const buttonBox = await button.boundingBox();
      const linkBoxes = await page.locator("footer .footer-links a").evaluateAll((links) => links.map((link) => link.getBoundingClientRect().toJSON()));
      expect(buttonBox).not.toBeNull();
      const box = { left: buttonBox!.x, right: buttonBox!.x + buttonBox!.width, top: buttonBox!.y, bottom: buttonBox!.y + buttonBox!.height };
      for (const linkBox of linkBoxes) {
        expect(intersects(box, linkBox), `back-to-top overlaps footer link @${width}px`).toBe(false);
      }
    }
  });

  test("donation popup close button never covers the QR code or text", async ({ page }) => {
    for (const width of [320, 375, 390]) {
      await page.setViewportSize({ width, height: 800 });
      await page.goto("/spenden/", { waitUntil: "load" });
      await expect(page.locator("[data-donation-popup]")).toHaveAttribute("open", "");
      const optionCount = await popupOptionCount(page);
      for (let index = 0; index < optionCount; index += 1) {
        await showPopupOption(page, index);
        for (const position of ["top", "middle", "bottom"]) {
          const overlaps = await page.evaluate((scrollPosition) => {
            const option = document.querySelector<HTMLElement>(".donation-popup-option:not([hidden])");
            const close = document.querySelector(".donation-popup-close");
            if (!option || !close) throw new Error("popup is incomplete");
            const max = option.scrollHeight - option.clientHeight;
            option.scrollTop = scrollPosition === "top" ? 0 : scrollPosition === "middle" ? max / 2 : max;
            const closeRect = close.getBoundingClientRect();
            const optionRect = option.getBoundingClientRect();
            return [...option.querySelectorAll("img, p, h2, a, li")]
              .filter((element) => {
                const rect = element.getBoundingClientRect();
                const visibleTop = Math.max(rect.top, optionRect.top);
                const visibleBottom = Math.min(rect.bottom, optionRect.bottom);
                if (visibleBottom <= visibleTop) return false;
                return Math.min(rect.right, closeRect.right) - Math.max(rect.left, closeRect.left) > 0.5 && Math.min(visibleBottom, closeRect.bottom) - Math.max(visibleTop, closeRect.top) > 0.5;
              })
              .map((element) => element.tagName + ":" + (element.textContent || "").trim().slice(0, 30));
          }, position);
          expect(overlaps, `close button overlap @${width}px option ${index} ${position}`).toEqual([]);
        }
      }
    }
  });

  test("donation QR codes are never cropped", async ({ page }) => {
    for (const width of [320, 390, 768, 1024, 1366]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/spenden/", { waitUntil: "load" });
      const optionCount = await popupOptionCount(page);
      for (let index = 0; index < optionCount; index += 1) {
        await showPopupOption(page, index);
        const fits = await page.locator(".donation-popup-option:not([hidden]) .donation-popup-option-image img").evaluate((image: HTMLImageElement) => getComputedStyle(image).objectFit);
        expect(["contain", "scale-down"], `popup image object-fit @${width}px option ${index}`).toContain(fits);
      }
      const projectFits = await page.locator(".donation-project-media img").evaluateAll((images) => images.map((image) => getComputedStyle(image).objectFit));
      for (const fit of projectFits) expect(["contain", "scale-down"], `project image object-fit @${width}px`).toContain(fit);
    }
  });

  test("donation popup call-to-action is reachable in landscape and short viewports", async ({ page }) => {
    for (const [width, height] of [
      [667, 375],
      [844, 390],
      [1280, 400],
    ]) {
      await page.setViewportSize({ width, height });
      await page.goto("/spenden/", { waitUntil: "load" });
      const optionCount = await popupOptionCount(page);
      for (let index = 0; index < optionCount; index += 1) {
        await showPopupOption(page, index);
        const geometry = await page.evaluate(() => {
          const dialog = document.querySelector("[data-donation-popup]");
          const option = document.querySelector<HTMLElement>(".donation-popup-option:not([hidden])");
          const action = option?.querySelector(".donation-popup-action");
          if (!dialog || !option) throw new Error("popup is incomplete");
          option.scrollTop = option.scrollHeight;
          const dialogRect = dialog.getBoundingClientRect();
          const actionRect = action?.getBoundingClientRect();
          return { dialogBottom: dialogRect.bottom, actionBottom: actionRect?.bottom ?? null, viewport: window.innerHeight };
        });
        expect(geometry.dialogBottom, `dialog @${width}x${height}`).toBeLessThanOrEqual(geometry.viewport);
        if (geometry.actionBottom !== null) {
          expect(geometry.actionBottom, `call-to-action @${width}x${height} option ${index}`).toBeLessThanOrEqual(geometry.dialogBottom);
        }
      }
    }
  });

  test("donation popup content wraps inside the dialog with 200% text size", async ({ page }) => {
    for (const width of [320, 390]) {
      await page.setViewportSize({ width, height: 844 });
      await page.goto("/spenden/", { waitUntil: "load" });
      await scaleText(page, 200);
      await waitForFonts(page);
      const optionCount = await popupOptionCount(page);
      for (let index = 0; index < optionCount; index += 1) {
        await showPopupOption(page, index);
        const outside = await rr(page, "wordsOutside", ".donation-popup-option:not([hidden])", "[data-donation-popup]");
        expect(outside, `popup @${width}px 200% option ${index}`).toEqual([]);
      }
    }
  });

  test("sliders without JavaScript show one slide instead of stacking", async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    try {
      for (const route of ["/", "/elternengagement/", "/speiseplan/", "/verein/", "/schule/"]) {
        for (const width of [390, 1280]) {
          await page.setViewportSize({ width, height: 900 });
          await page.goto(route, { waitUntil: "load" });
          await page.waitForLoadState("networkidle");
          const sliders = await page.locator(".swiper").evaluateAll((elements) =>
            elements.map((slider) => {
              const sliderRect = slider.getBoundingClientRect();
              const slides = [...slider.querySelectorAll(":scope > .swiper-wrapper > .swiper-slide")].filter((slide) => getComputedStyle(slide).display !== "none");
              const below = slides.filter((slide) => slide.getBoundingClientRect().top > sliderRect.top + 1);
              return { below: below.length, overflow: getComputedStyle(slider).overflow };
            }),
          );
          for (const slider of sliders) {
            expect(slider.below, `${route} @${width}px stacked slides`).toBe(0);
            expect(slider.overflow, `${route} @${width}px slider overflow`).toMatch(/hidden|clip/);
          }
        }
      }
    } finally {
      await context.close();
    }
  });

  test("print output shows all revealed content and no donation popup", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    for (const route of ["/schule/", "/verein/", "/kontakt/"]) {
      await page.goto(route, { waitUntil: "load" });
      await page.emulateMedia({ media: "print" });
      const hidden = await page.locator("[data-reveal]").evaluateAll((elements) => elements.filter((element) => Number.parseFloat(getComputedStyle(element).opacity) < 1).length);
      expect(hidden, `${route} hidden reveal blocks in print`).toBe(0);
      await page.emulateMedia({ media: "screen" });
    }

    await page.goto("/spenden/", { waitUntil: "load" });
    await expect(page.locator("[data-donation-popup]")).toHaveAttribute("open", "");
    await page.emulateMedia({ media: "print" });
    await expect(page.locator("[data-donation-popup]")).toHaveCSS("display", "none");
  });
});

test.describe("rendering regressions, round 2", () => {
  test.beforeEach(async ({ page }) => {
    await installRenderingHelpers(page);
  });

  test("mailto envelope stays on the address line without an underlined leading space", async ({ page }) => {
    for (const route of ["/kontakt/", "/impressum/", "/datenschutz/"]) {
      for (const width of [320, 375, 414]) {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(route, { waitUntil: "load" });
        await waitForFonts(page);
        const problems = await page.evaluate(() => {
          const result: string[] = [];
          document.querySelectorAll<HTMLAnchorElement>('main a[href^="mailto:"]').forEach((link) => {
            const text = link.textContent || "";
            if (/^[\s ]/.test(text)) result.push(`leading space in "${text}"`);
            const icon = link.querySelector(".fa-envelope") || (link.previousElementSibling?.matches(".fa-envelope") ? link.previousElementSibling : null);
            const walker = document.createTreeWalker(link, NodeFilter.SHOW_TEXT);
            let first: Text | null = null;
            let node: Node | null;
            while ((node = walker.nextNode())) {
              if (node.textContent?.trim()) {
                first = node as Text;
                break;
              }
            }
            if (!icon || !first) return;
            const offset = (first.textContent || "").search(/\S/);
            const range = document.createRange();
            range.setStart(first, offset);
            range.setEnd(first, offset + 1);
            const charRect = range.getBoundingClientRect();
            const iconRect = icon.getBoundingClientRect();
            if (Math.abs(charRect.top + charRect.height / 2 - (iconRect.top + iconRect.height / 2)) > charRect.height / 2) {
              result.push(`icon on its own line before "${text.trim()}"`);
            }
          });
          return result;
        });
        expect(problems, `${route} @${width}px`).toEqual([]);

        // The helper splits on letters/digits, so breaks at "-", "." or "@" never show up as a split word.
        const fragments = await rr(page, "wordFragments", 'main a[href^="mailto:"]');
        expect(
          fragments.map((entry) => `${entry.word} -> ${entry.fragments.join(" | ")}`),
          `${route} @${width}px address breaks`,
        ).toEqual([]);
      }
    }
  });

  test("share buttons do not get the mailto envelope and line up at one size", async ({ page }) => {
    for (const width of [390, 1280]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/aktuelles/post-1/", { waitUntil: "load" });
      await expect(page.locator(".share-icons .fa-envelope")).toHaveCount(0);
      const boxes = await page.locator(".share-icons .share-link").evaluateAll((links) =>
        links.map((link) => {
          const rect = link.getBoundingClientRect();
          return { cls: link.className, width: rect.width, height: rect.height, center: rect.top + rect.height / 2 };
        }),
      );
      expect(boxes.length).toBeGreaterThan(2);
      for (const box of boxes) {
        expect(Math.abs(box.width - boxes[0].width), `${box.cls} width @${width}px`).toBeLessThanOrEqual(1);
        expect(Math.abs(box.height - boxes[0].height), `${box.cls} height @${width}px`).toBeLessThanOrEqual(1);
        expect(Math.abs(box.center - boxes[0].center), `${box.cls} vertical position @${width}px`).toBeLessThanOrEqual(2);
      }
    }
  });

  test("portrait names and roles only hyphenate long compound words", async ({ page }) => {
    for (const route of ["/schule/", "/verein/"]) {
      for (const width of [320, 375, 414, 1280]) {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(route, { waitUntil: "load" });
        await waitForFonts(page);
        const fragments = await rr(page, "wordFragments", ".circle-items-title, .circle-items-subtitle");
        const badBreaks = fragments.filter((entry) => entry.word.length < 12 || entry.fragments.some((fragment) => fragment.length < 6));
        expect(
          badBreaks.map((entry) => `${entry.word} -> ${entry.fragments.join(" | ")}`),
          `${route} @${width}px`,
        ).toEqual([]);
      }
    }
  });

  test("related posts keep their dates on one line", async ({ page }) => {
    for (const width of [390, 768, 1024, 1366]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/aktuelles/post-1/", { waitUntil: "load" });
      await waitForFonts(page);
      const wrapped = await page.evaluate(() =>
        [...document.querySelectorAll(".heading-divider > ul > li")]
          .filter((li) => {
            const style = getComputedStyle(li);
            const lineHeight = Number.parseFloat(style.lineHeight) || Number.parseFloat(style.fontSize) * 1.5;
            return li.getBoundingClientRect().height > lineHeight * 1.5;
          })
          .map((li) => li.textContent?.trim()),
      );
      expect(wrapped, `@${width}px`).toEqual([]);
      const fragments = await rr(page, "wordFragments", ".heading-divider > h3.card-title");
      expect(shortFragments(fragments, 5), `related titles @${width}px`).toEqual([]);
    }
  });

  test("tag pages show a title and an even card grid", async ({ page }) => {
    for (const route of ["/tags/termin/", "/tags/mitglieder/"]) {
      for (const width of [390, 768, 1280]) {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(route, { waitUntil: "load" });
        await expect(page.locator("main h1")).toBeVisible();
        const rows = await page.locator("main .card").evaluateAll((cards) => {
          const byRow = new Map<number, number[]>();
          cards.forEach((card) => {
            const rect = card.getBoundingClientRect();
            const key = Math.round(rect.top);
            byRow.set(key, [...(byRow.get(key) || []), Math.round(rect.width)]);
          });
          return [...byRow.values()];
        });
        const allWidths = rows.flat();
        expect(Math.max(...allWidths) - Math.min(...allWidths), `${route} @${width}px card widths ${JSON.stringify(rows)}`).toBeLessThanOrEqual(2);
      }
    }
  });

  test("taxonomy overview pages are not blank", async ({ page }) => {
    for (const route of ["/tags/", "/categories/"]) {
      await page.goto(route, { waitUntil: "load" });
      await expect(page.locator("main h1"), route).toBeVisible();
      await expect(page.locator("main h1"), route).not.toHaveText(/^(Tags|Categories)$/);
      // Besides the title there must be visible content: the term list or a short empty-state note.
      await expect(page.locator("main > :not(section:first-child) :is(li, p):visible").first(), route).toBeVisible();
    }
  });

  test("speiseplan kicker and notes align with their headings", async ({ page }) => {
    for (const width of [390, 768, 1280, 1920]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/speiseplan/", { waitUntil: "load" });
      const offsets = await page.evaluate(() => {
        const kicker = document.querySelector(".speiseplan-week > .speiseplan-kicker");
        const weekHeading = kicker?.parentElement?.querySelector("h2");
        const notes = document.querySelector(".speiseplan-notes");
        const notesHeading = notes?.querySelector("h2, h3");
        const notesList = notes?.querySelector("ul, ol");
        if (!kicker || !weekHeading || !notesHeading || !notesList) throw new Error("speiseplan structure changed");
        return {
          kicker: kicker.getBoundingClientRect().left - weekHeading.getBoundingClientRect().left,
          notes: notesList.getBoundingClientRect().left - notesHeading.getBoundingClientRect().left,
        };
      });
      expect(Math.abs(offsets.kicker), `kicker @${width}px`).toBeLessThanOrEqual(2);
      expect(Math.abs(offsets.notes), `notes list @${width}px`).toBeLessThanOrEqual(2);
    }
  });

  test("news card meta line spaces icons evenly and keeps tags apart", async ({ page }) => {
    for (const width of [390, 1280]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/", { waitUntil: "load" });
      await waitForFonts(page);
      const gaps = await page
        .locator("main .card")
        .first()
        .evaluate((card) => {
          const textStart = (element: Element) => {
            const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
            let node: Node | null;
            while ((node = walker.nextNode())) {
              const text = node.textContent || "";
              const offset = text.search(/\S/);
              if (offset >= 0) {
                const range = document.createRange();
                range.setStart(node, offset);
                range.setEnd(node, offset + 1);
                return range.getBoundingClientRect().left;
              }
            }
            throw new Error("no text");
          };
          const calendar = card.querySelector(".fa-calendar");
          const dateItem = calendar?.parentElement;
          const tags = [...card.querySelectorAll("ul a.btn")];
          if (!calendar || !dateItem || tags.length < 2) throw new Error("card meta changed");
          const tagIcons = tags.map((tag) => tag.querySelector("i") as Element);
          return {
            calendar: textStart(dateItem) - calendar.getBoundingClientRect().right,
            tag: textStart(tags[0]) - tagIcons[0].getBoundingClientRect().right,
            between: tagIcons[1].getBoundingClientRect().left - tags[0].getBoundingClientRect().right,
          };
        });
      expect(gaps.calendar, `calendar gap @${width}px`).toBeGreaterThanOrEqual(4);
      expect(Math.abs(gaps.calendar - gaps.tag), `icon gaps @${width}px ${JSON.stringify(gaps)}`).toBeLessThanOrEqual(4);
      expect(gaps.between, `gap between tags @${width}px ${JSON.stringify(gaps)}`).toBeGreaterThan(gaps.tag + 2);
    }
  });

  test("news dates use the German day format with a dot", async ({ page }) => {
    for (const route of ["/", "/aktuelles/post-1/"]) {
      await page.goto(route, { waitUntil: "load" });
      const dates = await page.locator("main li:has(.fa-calendar)").allTextContents();
      expect(dates.length, route).toBeGreaterThan(0);
      for (const date of dates) expect(date.trim(), route).toMatch(/^[A-Z][a-z]+, \d{1,2}\. [A-ZÄÖÜ][a-zäöü]+ \d{4}$/);
    }
  });

  test("donation hero button centres its wrapped label with breathing room", async ({ page }) => {
    await dismissDonationPopup(page);
    for (const width of [320, 375, 1280]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/spenden/", { waitUntil: "load" });
      await waitForFonts(page);
      await page.waitForTimeout(1200);
      const layout = await page.locator(".donation-hero-cta").evaluate((cta) => {
        const ctaRect = cta.getBoundingClientRect();
        const lines = new Map<number, { left: number; right: number }>();
        const walker = document.createTreeWalker(cta, NodeFilter.SHOW_TEXT);
        let node: Node | null;
        while ((node = walker.nextNode())) {
          const range = document.createRange();
          range.selectNodeContents(node);
          [...range.getClientRects()].forEach((rect) => {
            if (!rect.width) return;
            const key = Math.round(rect.top);
            const line = lines.get(key) || { left: rect.left, right: rect.right };
            lines.set(key, { left: Math.min(line.left, rect.left), right: Math.max(line.right, rect.right) });
          });
        }
        const tops = [...lines.keys()];
        return {
          paddingTop: Math.min(...tops) - ctaRect.top,
          centers: [...lines.values()].slice(1).map((line) => (line.left + line.right) / 2 - (ctaRect.left + ctaRect.right) / 2),
        };
      });
      expect(layout.paddingTop, `top padding @${width}px`).toBeGreaterThanOrEqual(6);
      for (const offset of layout.centers) expect(Math.abs(offset), `wrapped line centring @${width}px`).toBeLessThanOrEqual(3);
    }
  });

  test("donation hero text panel aligns with the page column on wide screens", async ({ page }) => {
    await dismissDonationPopup(page);
    for (const width of [1366, 1920, 2560]) {
      await page.setViewportSize({ width, height: 1080 });
      await page.goto("/spenden/", { waitUntil: "load" });
      const offset = await page.evaluate(() => {
        const panel = document.querySelector(".donation-hero-copy");
        const titleSection = document.querySelector("main > section.container");
        if (!panel || !titleSection) throw new Error("spenden structure changed");
        return panel.getBoundingClientRect().left - titleSection.getBoundingClientRect().left;
      });
      expect(Math.abs(offset), `panel offset @${width}px`).toBeLessThanOrEqual(80);
    }
  });

  test("markdown images reserve their space before they load", async ({ page }) => {
    await page.route(/\.(png|jpe?g|webp)(\?.*)?$/, (route) => route.abort());
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/schule/", { waitUntil: "load" });
    const collapsed = await page.locator(".schule-content img").evaluateAll((images) =>
      images.filter((image) => image.closest(".swiper, .circle-items") === null && image.getBoundingClientRect().height < 20).map((image) => image.getAttribute("src")),
    );
    expect(collapsed).toEqual([]);
  });

  test("donation popup close button paints above the image panel", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/spenden/", { waitUntil: "load" });
    const close = page.locator("[data-donation-popup-close]");
    await close.focus();
    const stacking = await close.evaluate((button) => {
      const style = getComputedStyle(button);
      const option = document.querySelector(".donation-popup-option:not([hidden])");
      const outline = Number.parseFloat(style.outlineWidth) + Number.parseFloat(style.outlineOffset);
      const gap = option ? option.getBoundingClientRect().top - button.getBoundingClientRect().bottom : 0;
      return { position: style.position, zIndex: Number.parseInt(style.zIndex, 10) || 0, outline, gap };
    });
    // Either the ring fits into the gap above the panel or the button is stacked above it.
    expect(stacking.gap >= stacking.outline || (stacking.position !== "static" && stacking.zIndex > 0), JSON.stringify(stacking)).toBe(true);
  });

  test("page outline focus rings stay fully visible", async ({ page, isMobile }) => {
    test.skip(isMobile, "the outline rail requires a fine pointer");
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/impressum/", { waitUntil: "load" });
    const links = page.locator(".page-outline-link, .page-outline-title");
    const count = await links.count();
    for (let index = 0; index < count; index += 1) {
      await links.nth(index).focus();
      const ring = await links.nth(index).evaluate((link) => {
        const style = getComputedStyle(link);
        const extent = Number.parseFloat(style.outlineWidth) + Number.parseFloat(style.outlineOffset);
        const rect = link.getBoundingClientRect();
        const clip = link.closest(".page-outline-list")?.getBoundingClientRect() ?? { left: 0, right: window.innerWidth };
        return { left: rect.left - extent, right: rect.right + extent, clipLeft: Math.max(0, clip.left), clipRight: clip.right };
      });
      expect(ring.left, `focus ring left edge of outline item ${index}`).toBeGreaterThanOrEqual(ring.clipLeft);
      expect(ring.right, `focus ring right edge of outline item ${index}`).toBeLessThanOrEqual(ring.clipRight);
    }
  });

  test("mobile menu closes when the layout switches to the desktop navigation", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/schule/", { waitUntil: "load" });
    await page.locator('a[href="#mymenu"]').click();
    await expect(page.locator("#mymenu")).toHaveClass(/mm-menu--opened/);
    await page.setViewportSize({ width: 844, height: 390 });
    await expect(page.locator("#mymenu")).not.toHaveClass(/mm-menu--opened/);
  });

  test("Elternsprechabend title only breaks at real syllable boundaries", async ({ page }) => {
    for (const width of [320, 360, 390, 414, 768]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/aktuelles/post-1/", { waitUntil: "load" });
      await waitForFonts(page);
      const lines = await page.locator("main h1").evaluate((title) => {
        const byLine = new Map<number, string>();
        const walker = document.createTreeWalker(title, NodeFilter.SHOW_TEXT);
        let node: Node | null;
        while ((node = walker.nextNode())) {
          const text = node.textContent || "";
          for (let index = 0; index < text.length; index += 1) {
            if (text[index] === "­") continue;
            const range = document.createRange();
            range.setStart(node, index);
            range.setEnd(node, index + 1);
            const rect = [...range.getClientRects()].filter((r) => r.width > 0).at(-1);
            if (!rect) continue;
            const key = Math.round(rect.top / 8);
            byLine.set(key, (byLine.get(key) || "") + text[index]);
          }
        }
        return [...byLine.values()].map((line) => line.trim());
      });
      for (const line of lines) expect(["Elternsprechabend", "Eltern", "sprechabend", "Elternsprech", "abend", "sprech"], `line "${line}" @${width}px`).toContain(line);
    }
  });

  test("no page shows raw Markdown link syntax or escaped characters in alt texts", async ({ page }) => {
    const routes = ["/", "/schule/", "/elternengagement/", "/verein/", "/spenden/", "/speiseplan/", "/kontakt/", "/impressum/", "/datenschutz/", "/presse/", "/aktuelles/post-1/"];
    for (const route of routes) {
      await page.goto(route, { waitUntil: "load" });
      const rawLinks = await page.locator("main").evaluate((main) => (main.textContent || "").match(/\[[^\]]+\]\([^)]*\)/g) || []);
      expect(rawLinks, route).toEqual([]);
      const escapedAlts = await page.locator("main img[alt*='\\\\']").evaluateAll((images) => images.map((image) => image.getAttribute("alt")));
      expect(escapedAlts, route).toEqual([]);
    }
  });

  test("e-mail labels are followed by an e-mail address", async ({ page }) => {
    for (const route of ["/datenschutz/", "/impressum/", "/kontakt/"]) {
      await page.goto(route, { waitUntil: "load" });
      const text = await page.locator("main").innerText();
      const wrongValues = [...text.matchAll(/E-Mail:\s*([^\n]+)/g)].map((match) => match[1].trim()).filter((value) => !value.includes("@"));
      expect(wrongValues, route).toEqual([]);
    }
  });

  test("mobile navigation links are reachable without JavaScript", async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
    const page = await context.newPage();
    try {
      await page.goto("/schule/", { waitUntil: "load" });
      for (const name of ["Aktuelles", "Schule", "Elternarbeit", "Spenden", "Verein"]) {
        await expect(page.locator("[data-sticky-navigation]").getByRole("link", { name, exact: true }), name).toBeVisible();
      }
      await expectNoHorizontalOverflow(page, "no-JS mobile navigation");
    } finally {
      await context.close();
    }
  });

  test("speiseplan week range uses an en dash", async ({ page }) => {
    await page.goto("/speiseplan/", { waitUntil: "load" });
    await expect(page.locator(".speiseplan-week h2").first()).toHaveText(/^Woche vom [\d.]+–[\d.]+$/);
  });

  test("portrait captions have balanced parentheses", async ({ page }) => {
    for (const route of ["/schule/", "/verein/"]) {
      await page.goto(route, { waitUntil: "load" });
      const captions = await page.locator(".circle-items-title, .circle-items-subtitle").allTextContents();
      const unbalanced = captions.filter((text) => (text.match(/\(/g) || []).length !== (text.match(/\)/g) || []).length);
      expect(unbalanced, route).toEqual([]);
    }
  });
});

// Words that are split although they would fit on one line, or split into more pieces than the line width requires.
const wastefulSplits = (page: Page, selector: string) =>
  page.evaluate((target) => {
    const result: string[] = [];
    document.querySelectorAll<HTMLElement>(target).forEach((element) => {
      const style = getComputedStyle(element);
      const lineWidth = element.clientWidth - Number.parseFloat(style.paddingLeft) - Number.parseFloat(style.paddingRight);
      const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
      let node: Node | null;
      while ((node = walker.nextNode())) {
        const text = node.textContent || "";
        for (const match of text.matchAll(/[\p{L}\p{N}]+/gu)) {
          const start = match.index ?? 0;
          const tops = new Set<number>();
          let width = 0;
          for (let i = 0; i < match[0].length; i += 1) {
            const range = document.createRange();
            range.setStart(node, start + i);
            range.setEnd(node, start + i + 1);
            const rect = [...range.getClientRects()].filter((r) => r.width > 0).at(-1);
            if (!rect) continue;
            tops.add(Math.round(rect.top / 4));
            width += rect.width;
          }
          if (tops.size < 2) continue;
          const needed = Math.ceil(width / lineWidth);
          if (tops.size > needed) result.push(`${match[0]}: ${tops.size} pieces, ${needed} needed (word ${Math.round(width)}px, line ${Math.round(lineWidth)}px)`);
        }
      }
    });
    return result;
  }, selector);

test.describe("rendering regressions, round 3", () => {
  test.beforeEach(async ({ page }) => {
    await installRenderingHelpers(page);
    await dismissDonationPopup(page);
  });

  for (const route of ["/spenden/", "/aktuelles/post-2/", "/aktuelles/post-4/", "/aktuelles/2025-03-24-mitgliederversammlung-cms-2025/", "/elternengagement/"]) {
    test(`page title on ${route} only hyphenates when a word cannot fit`, async ({ page }) => {
      for (const width of [345, 420, 520, 670, 768, 860, 1024, 1279]) {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(route, { waitUntil: "load" });
        await waitForFonts(page);
        expect(await wastefulSplits(page, "main h1"), `${route} @${width}px`).toEqual([]);
      }
    });
  }

  test("news card titles only hyphenate when a word cannot fit", async ({ page }) => {
    for (const route of ["/", "/aktuelles/", "/tags/termin/"]) {
      for (const width of [320, 390, 768, 1024, 1366]) {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(route, { waitUntil: "load" });
        await waitForFonts(page);
        expect(await wastefulSplits(page, "main .card-title"), `${route} @${width}px`).toEqual([]);
      }
    }
  });

  test("content headings avoid short hyphenation fragments and lone last words", async ({ page }) => {
    for (const route of ["/datenschutz/", "/schule/", "/impressum/"]) {
      for (const width of [280, 320, 375, 414, 520, 600, 700]) {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(route, { waitUntil: "load" });
        await waitForFonts(page);
        const selector = ".reading-prose > :is(h2, h3, h4), .schule-content :is(h2, h3, h4)";
        const fragments = await rr(page, "wordFragments", selector);
        expect(shortFragments(fragments, 4), `${route} @${width}px fragments`).toEqual([]);
        const widows = await page.evaluate((target) => {
          const result: string[] = [];
          document.querySelectorAll(target).forEach((heading) => {
            const words: { top: number; text: string }[] = [];
            const walker = document.createTreeWalker(heading, NodeFilter.SHOW_TEXT);
            let node: Node | null;
            while ((node = walker.nextNode())) {
              for (const match of (node.textContent || "").matchAll(/\S+/g)) {
                const range = document.createRange();
                range.setStart(node, (match.index ?? 0) + match[0].length - 1);
                range.setEnd(node, (match.index ?? 0) + match[0].length);
                const rect = [...range.getClientRects()].filter((r) => r.width > 0).at(-1);
                if (rect) words.push({ top: Math.round(rect.top / 4), text: match[0] });
              }
            }
            const lines = new Set(words.map((word) => word.top));
            if (words.length < 4 || lines.size < 2) return;
            const lastTop = words.at(-1)!.top;
            const lastLineWords = words.filter((word) => word.top === lastTop);
            if (lastLineWords.length === 1 && !(lastLineWords[0].text.length > 12)) result.push(heading.textContent?.trim() || "");
          });
          return result;
        }, selector);
        expect(widows, `${route} @${width}px lone last words`).toEqual([]);
      }
    }
  });

  test("impressum heading prefers the slash over hyphenating its compounds", async ({ page }) => {
    for (const width of [500, 520, 1280, 1366, 1920]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/impressum/", { waitUntil: "load" });
      await waitForFonts(page);
      const fragments = await rr(page, "wordFragments", "#verbraucherstreitbeilegunguniversalschlichtungsstelle");
      expect(
        fragments.map((entry) => `${entry.word} -> ${entry.fragments.join(" | ")}`),
        `@${width}px`,
      ).toEqual([]);
    }
  });

  test("opening the Fediverse share field keeps the share icons intact", async ({ page }) => {
    for (const width of [320, 375, 1280]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/aktuelles/post-1/", { waitUntil: "load" });
      await page.locator(".share-fediverse").click();
      const wrapper = page.locator(".fediverse-input-wrapper");
      await expect(wrapper).toBeVisible();
      const state = await page.evaluate(() => {
        const links = [...document.querySelectorAll(".share-icons .share-link")].map((link) => Math.round(link.getBoundingClientRect().width));
        const wrapperRect = document.querySelector(".fediverse-input-wrapper")!.getBoundingClientRect();
        const input = document.querySelector(".fediverse-input")!;
        return { links, left: wrapperRect.left, right: wrapperRect.right, viewport: document.documentElement.clientWidth, inputBorder: Number.parseFloat(getComputedStyle(input).borderTopWidth) };
      });
      expect(new Set(state.links).size, `share icon widths @${width}px ${state.links.join(",")}`).toBe(1);
      expect(state.links[0], `share icon width @${width}px`).toBeGreaterThanOrEqual(15);
      expect(state.left, `popover left @${width}px`).toBeGreaterThanOrEqual(0);
      expect(state.right, `popover right @${width}px`).toBeLessThanOrEqual(state.viewport);
      expect(state.inputBorder, `input border @${width}px`).toBeGreaterThanOrEqual(1);
    }
  });

  test("page outline rail stays hidden on coarse-pointer tablets", async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 1194, height: 834 }, hasTouch: true, isMobile: true });
    const page = await context.newPage();
    try {
      await page.goto("/schule/", { waitUntil: "load" });
      test.skip(!(await page.evaluate(() => matchMedia("(pointer: coarse)").matches)), "this engine does not emulate a coarse pointer");
      await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight / 2));
      await page.waitForTimeout(300);
      await expect(page.locator("[data-page-outline]")).toHaveCSS("display", "none");
    } finally {
      await context.close();
    }
  });

  test("page outline rail ends above the footer", async ({ page, isMobile }) => {
    test.skip(isMobile, "the outline rail requires a fine pointer");
    for (const route of ["/schule/", "/impressum/", "/datenschutz/"]) {
      for (const height of [800, 500]) {
        await page.setViewportSize({ width: 1280, height });
        await page.goto(route, { waitUntil: "load" });
        await page.evaluate(() => {
          document.documentElement.style.scrollBehavior = "auto";
          window.scrollTo(0, document.documentElement.scrollHeight);
        });
        await page.waitForTimeout(300);
        const geometry = await page.evaluate(() => {
          const outline = document.querySelector<HTMLElement>("[data-page-outline]")!;
          const footer = document.querySelector("footer")!;
          return { hidden: outline.hidden || getComputedStyle(outline).display === "none", bottom: outline.getBoundingClientRect().bottom, footerTop: footer.getBoundingClientRect().top };
        });
        if (!geometry.hidden) expect(geometry.bottom, `${route} @1280x${height}`).toBeLessThanOrEqual(geometry.footerTop);
      }
    }
  });

  test("back-to-top button does not keep its hover colour after a tap on touch screens", async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 390, height: 800 }, hasTouch: true, isMobile: true });
    const page = await context.newPage();
    try {
      await page.goto("/schule/", { waitUntil: "load" });
      test.skip(await page.evaluate(() => matchMedia("(hover: hover)").matches), "this engine reports hover support");
      await page.evaluate(() => window.scrollTo(0, 2000));
      const button = page.locator("[data-back-to-top]");
      await expect(button).toHaveAttribute("data-visible", "true");
      await button.tap();
      await page.evaluate(() => {
        document.documentElement.style.scrollBehavior = "auto";
        window.scrollTo(0, 2000);
      });
      await expect(button).toHaveAttribute("data-visible", "true");
      await expect(button).toHaveCSS("background-color", "rgb(255, 255, 255)");
    } finally {
      await context.close();
    }
  });

  test("markdown links have no trailing space inside the link", async ({ page }) => {
    for (const route of ["/datenschutz/", "/schule/", "/impressum/", "/kontakt/", "/elternengagement/"]) {
      await page.goto(route, { waitUntil: "load" });
      const trailing = await page.locator("main .reading-prose a, main .schule-content a").evaluateAll((links) => links.filter((link) => /\s$/.test(link.textContent || "")).map((link) => link.textContent));
      expect(trailing, route).toEqual([]);
    }
  });

  test("CMS login shows the correctly spelled app title", async ({ request }) => {
    const config = await (await request.get("/admin/config.yml")).text();
    expect(config).toContain('app_title: "Montessori Schule Gilching CMS"');
  });

  test("footer sits at the bottom of the viewport on short pages", async ({ page }) => {
    for (const route of ["/presse/", "/categories/", "/tags/", "/404.html", "/karriere/"]) {
      for (const [width, height] of [
        [1280, 900],
        [1920, 1080],
        [390, 844],
      ]) {
        await page.setViewportSize({ width, height });
        await page.goto(route, { waitUntil: "load" });
        const footerBottom = await page.locator("footer").evaluate((footer) => footer.getBoundingClientRect().bottom + window.scrollY);
        expect(footerBottom, `${route} @${width}x${height}`).toBeGreaterThanOrEqual(height - 1);
      }
    }
  });

  test("404 page uses the shared page title style", async ({ page }) => {
    await page.goto("/schule/", { waitUntil: "load" });
    const reference = await page.locator("main h1").evaluate((title) => ({ font: getComputedStyle(title).fontFamily, color: getComputedStyle(title).color }));
    await page.goto("/404.html", { waitUntil: "load" });
    const title = page.locator("main h1");
    await expect(title).toHaveClass(/page-title-calligraphy/);
    await expect(title).toHaveCSS("font-family", reference.font);
    await expect(title).toHaveCSS("color", reference.color);
    await expect(page.locator("main .hero-3xl")).toHaveCount(0);
  });

  test("footer links keep a gap to the edges of their band", async ({ page }) => {
    for (const width of [315, 320, 325, 360]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/kontakt/", { waitUntil: "load" });
      await waitForFonts(page);
      const gaps = await page.locator("footer .footer-links").evaluate((band) => {
        const bandRect = band.getBoundingClientRect();
        const links = [...band.querySelectorAll("a")].map((link) => link.getBoundingClientRect());
        return { left: Math.min(...links.map((rect) => rect.left)) - bandRect.left, right: bandRect.right - Math.max(...links.map((rect) => rect.right)) };
      });
      expect(gaps.left, `left gap @${width}px`).toBeGreaterThanOrEqual(4);
      expect(gaps.right, `right gap @${width}px`).toBeGreaterThanOrEqual(4);
    }
  });
});

// Relative luminance contrast of a CSS rgb()/rgba() colour blended onto an opaque background colour.
const contrastRatio = (foreground: string, background: string) => {
  const parse = (value: string) => (value.match(/[\d.]+/g) || []).map(Number);
  const [fr, fg, fb, fa = 1] = parse(foreground);
  const [br, bg, bb] = parse(background);
  const blend = [fr * fa + br * (1 - fa), fg * fa + bg * (1 - fa), fb * fa + bb * (1 - fa)];
  const luminance = (channels: number[]) =>
    channels
      .map((channel) => channel / 255)
      .map((channel) => (channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4))
      .reduce((sum, channel, index) => sum + channel * [0.2126, 0.7152, 0.0722][index], 0);
  const [high, low] = [luminance(blend), luminance([br, bg, bb])].sort((a, b) => b - a);
  return (high + 0.05) / (low + 0.05);
};

test.describe("rendering regressions, round 4", () => {
  test.beforeEach(async ({ page }) => {
    await installRenderingHelpers(page);
    await dismissDonationPopup(page);
  });

  test("desktop navigation wraps extra and long entries instead of overflowing", async ({ page }) => {
    for (const width of [768, 1024, 1280]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/schule/", { waitUntil: "load" });
      await page.evaluate(() => {
        const row = document.querySelector(".navbar-nav > div.flex-1");
        const template = [...(row?.querySelectorAll(":scope > li") || [])].find((item) => !item.querySelector("[aria-label]"));
        if (!row || !template) throw new Error("navigation structure changed");
        ["Termine", "Ganztagsbetreuungsangebote", "Häufige Fragen"].forEach((name) => {
          const clone = template.cloneNode(true) as HTMLElement;
          const link = clone.querySelector("a")!;
          link.textContent = name;
          link.removeAttribute("aria-current");
          row.append(clone);
        });
      });
      await expectNoHorizontalOverflow(page, `navigation @${width}px`);
      expect(await rr(page, "wordsOutside", ".navbar-nav"), `navigation @${width}px`).toEqual([]);
    }
  });

  test("wrapped footer links stay on the peach band at every width", async ({ page }) => {
    for (const width of [390, 768, 1280]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/kontakt/", { waitUntil: "load" });
      const result = await page.locator("footer .footer-links").evaluate((band) => {
        const list = band.querySelector("ul")!;
        const template = list.querySelector("li")!;
        ["Stellenangebote", "Satzung des Vereins", "Barrierefreiheit", "Häufige Fragen"].forEach((name) => {
          const clone = template.cloneNode(true) as HTMLElement;
          clone.querySelector("a")!.textContent = name;
          list.append(clone);
        });
        const bandRect = band.getBoundingClientRect();
        const outside = [...band.querySelectorAll("a")].filter((link) => {
          const rect = link.getBoundingClientRect();
          return rect.top < bandRect.top - 0.5 || rect.bottom > bandRect.bottom + 0.5;
        });
        return { background: getComputedStyle(band).backgroundColor, outside: outside.length };
      });
      expect(result.background, `band @${width}px`).toBe("rgb(255, 204, 153)");
      expect(result.outside, `links outside band @${width}px`).toBe(0);
    }
  });

  test("wide Markdown tables and code blocks scroll inside the text column", async ({ page }) => {
    for (const width of [390, 1280]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/aktuelles/post-1/", { waitUntil: "load" });
      const result = await page.evaluate(() => {
        const prose = document.querySelector("[data-page-outline-content].reading-prose")!;
        prose.insertAdjacentHTML(
          "beforeend",
          '<table><thead><tr><th>Tag</th><th>Zeit</th><th>Ort</th><th>Hinweis</th></tr></thead><tbody><tr><td>Donnerstag</td><td>08:00</td><td>https://www.montessorischule-gilching.de/sehr/langer/pfad/zur/veranstaltung</td><td>Grundstücksverkehrsgenehmigungszuständigkeit</td></tr></tbody></table><pre><code>const sehrLangeZeile = "' +
            "x".repeat(200) +
            '";</code></pre>',
        );
        const proseRect = prose.getBoundingClientRect();
        const table = prose.querySelector("table")!;
        const pre = prose.querySelector("pre")!;
        const cell = prose.querySelector("td")!;
        return {
          tableRight: table.getBoundingClientRect().right,
          preRight: pre.getBoundingClientRect().right,
          proseRight: proseRect.right,
          cellPadding: Number.parseFloat(getComputedStyle(cell).paddingLeft),
          preScrolls: pre.scrollWidth > pre.clientWidth && getComputedStyle(pre).overflowX === "auto",
        };
      });
      await expectNoHorizontalOverflow(page, `table/pre @${width}px`);
      expect(result.tableRight, `table @${width}px`).toBeLessThanOrEqual(result.proseRight + 1);
      expect(result.preRight, `pre @${width}px`).toBeLessThanOrEqual(result.proseRight + 1);
      expect(result.cellPadding, `cell padding @${width}px`).toBeGreaterThanOrEqual(4);
      expect(result.preScrolls, `pre scrolls @${width}px`).toBe(true);
    }
  });

  test("news card summaries are clamped to four lines", async ({ page }) => {
    for (const width of [390, 1280]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/", { waitUntil: "load" });
      const result = await page.locator("main .card .card-summary").first().evaluate((summary) => {
        summary.textContent = "Ein sehr langer Anrisstext. ".repeat(40);
        const style = getComputedStyle(summary);
        return { height: summary.getBoundingClientRect().height, lineHeight: Number.parseFloat(style.lineHeight) };
      });
      expect(result.height, `summary height @${width}px`).toBeLessThanOrEqual(result.lineHeight * 4 + 1);
    }
  });

  test("speiseplan grid survives long dish names and a fifth day", async ({ page }) => {
    for (const width of [390, 1280]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/speiseplan/", { waitUntil: "load" });
      await page.evaluate(() => {
        const grid = document.querySelector(".speiseplan-grid")!;
        grid.querySelector(".speiseplan-value")!.textContent = "Schokoladenpuddingmitvanillesoßeundsahnehäubchen";
        const days = grid.querySelectorAll(":scope > *");
        if (days.length === 4) grid.append(days[3].cloneNode(true));
      });
      await expectNoHorizontalOverflow(page, `speiseplan @${width}px`);
      const layout = await page.locator(".speiseplan-grid").evaluate((grid) => {
        const gridRect = grid.getBoundingClientRect();
        const days = [...grid.children].map((day) => day.getBoundingClientRect());
        return { overflow: days.some((day) => day.right > gridRect.right + 1), tops: new Set(days.map((day) => Math.round(day.top))).size };
      });
      expect(layout.overflow, `day cards inside the grid @${width}px`).toBe(false);
      if (width === 1280) expect(layout.tops, "five days share one row at 1280px").toBe(1);
    }
  });

  test("donation texts keep paragraph spacing and titles hyphenate long compounds", async ({ page }) => {
    for (const width of [390, 1280]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/spenden/", { waitUntil: "load" });
      const gap = await page.locator(".donation-project-content").first().evaluate((content) => {
        content.insertAdjacentHTML("beforeend", "<p>Zweiter Absatz.</p>");
        const paragraphs = content.querySelectorAll("p");
        const last = paragraphs[paragraphs.length - 1].getBoundingClientRect();
        const previous = paragraphs[paragraphs.length - 2].getBoundingClientRect();
        return last.top - previous.bottom;
      });
      expect(gap, `paragraph gap @${width}px`).toBeGreaterThanOrEqual(10);

      await page.locator(".donation-project-copy h3").first().evaluate((title) => {
        title.textContent = "Schulgartenneugestaltungsprojekt mit Hochbeeten";
      });
      await waitForFonts(page);
      await expect(page.locator(".donation-project-copy h3").first()).toHaveCSS("hyphens", "auto");
      const fragments = await rr(page, "wordFragments", ".donation-project-copy h3");
      expect(shortFragments(fragments, 4), `project title @${width}px`).toEqual([]);
    }
  });

  test("generated section headings hyphenate like Markdown headings", async ({ page }) => {
    for (const width of [390, 1280]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/schule/", { waitUntil: "load" });
      await page.locator("[data-section-heading]").first().evaluate((heading) => {
        heading.textContent = "Kooperationsvereinbarungsunterzeichnungsfeierlichkeiten";
      });
      await waitForFonts(page);
      await expect(page.locator("[data-section-heading]").first()).toHaveCSS("hyphens", "auto");
      const fragments = await rr(page, "wordFragments", "[data-section-heading]");
      expect(shortFragments(fragments, 4), `section heading @${width}px`).toEqual([]);
      expect(await rr(page, "wordsOutside", "[data-section-heading]"), `section heading @${width}px`).toEqual([]);
    }
  });

  test("blockquotes in news posts are styled as quotes", async ({ page }) => {
    await page.goto("/aktuelles/post-1/", { waitUntil: "load" });
    const style = await page.evaluate(() => {
      const prose = document.querySelector("[data-page-outline-content].reading-prose")!;
      prose.insertAdjacentHTML("beforeend", "<blockquote><p>Ein Zitat.</p></blockquote>");
      const quote = getComputedStyle(prose.querySelector("blockquote")!);
      return { border: Number.parseFloat(quote.borderLeftWidth), fontStyle: quote.fontStyle };
    });
    expect(style.border).toBeGreaterThanOrEqual(2);
    expect(style.fontStyle).toBe("italic");
  });

  test("links in body text are underlined, not marked by colour alone", async ({ page }) => {
    for (const route of ["/schule/", "/datenschutz/"]) {
      await page.goto(route, { waitUntil: "load" });
      const plain = await page.locator(".reading-prose a").evaluateAll((links) => links.filter((link) => !getComputedStyle(link).textDecorationLine.includes("underline")).map((link) => link.textContent?.trim()));
      expect(plain, route).toEqual([]);
    }
  });

  test("Fediverse field is German, readable and not truncated", async ({ page }) => {
    for (const width of [320, 1280]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/aktuelles/post-1/", { waitUntil: "load" });
      await page.locator(".share-fediverse").click();
      await expect(page.locator(".fediverse-check-button")).toHaveText("Teilen");
      const field = await page.locator(".fediverse-input").evaluate((input: HTMLInputElement) => {
        const style = getComputedStyle(input);
        const placeholder = getComputedStyle(input, "::placeholder");
        const probe = document.createElement("span");
        probe.style.cssText = `position:absolute;visibility:hidden;white-space:nowrap;font:${style.font}`;
        probe.textContent = input.placeholder;
        document.body.append(probe);
        const textWidth = probe.getBoundingClientRect().width;
        probe.remove();
        const contentWidth = input.clientWidth - Number.parseFloat(style.paddingLeft) - Number.parseFloat(style.paddingRight);
        return { placeholder: input.placeholder, color: placeholder.color, background: style.backgroundColor, textWidth, contentWidth };
      });
      expect(field.placeholder).not.toMatch(/Enter|Instance/);
      expect(field.textWidth, `placeholder fits @${width}px`).toBeLessThanOrEqual(field.contentWidth);
      expect(contrastRatio(field.color, field.background), `placeholder contrast @${width}px`).toBeGreaterThanOrEqual(4.5);
    }
  });

  test("mobile menu title is readable and the current page stands out", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/schule/", { waitUntil: "load" });
    await page.locator('a[href="#mymenu"]').click();
    await expect(page.locator("#mymenu")).toHaveClass(/mm-menu--opened/);
    const menu = await page.evaluate(() => {
      const title = document.querySelector(".mm-navbar__title > span") || document.querySelector(".mm-navbar__title");
      const menuElement = document.querySelector("#mymenu")!;
      const active = document.querySelector(".mm-listitem__text.active")!;
      const other = document.querySelector(".mm-listitem__text:not(.active)")!;
      return {
        titleColor: getComputedStyle(title!).color,
        background: getComputedStyle(menuElement).backgroundColor,
        activeWeight: Number.parseInt(getComputedStyle(active).fontWeight, 10),
        otherWeight: Number.parseInt(getComputedStyle(other).fontWeight, 10),
        activeDecoration: getComputedStyle(active).textDecorationLine,
      };
    });
    expect(contrastRatio(menu.titleColor, menu.background)).toBeGreaterThanOrEqual(4.5);
    expect(menu.activeWeight).toBeGreaterThan(menu.otherWeight);
    expect(menu.activeDecoration).toContain("underline");
  });

  test("desktop navigation marks the current page", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    for (const [route, current] of [
      ["/schule/", "/schule/"],
      ["/verein/", "/verein/"],
    ]) {
      await page.goto(route, { waitUntil: "load" });
      const currentLinks = page.locator('.navbar-nav a[aria-current="page"]:visible');
      await expect(currentLinks, route).toHaveCount(1);
      await expect(currentLinks.first(), route).toHaveAttribute("href", current);
      await expect(currentLinks.first(), route).toHaveCSS("text-decoration-line", "underline");
      await expect(currentLinks.first(), route).not.toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
    }
  });

  test("400% zoom keeps the donation hero panel and section cards usable", async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 320, height: 256 }, deviceScaleFactor: 4 });
    const page = await context.newPage();
    try {
      await page.addInitScript(() => {
        try {
          window.sessionStorage.setItem("monte-donation-highlight-dismissed", "true");
        } catch {
          // ignore
        }
      });
      await page.goto("/spenden/", { waitUntil: "load" });
      const hero = await page.evaluate(() => {
        const heroRect = document.querySelector(".donation-hero")!.getBoundingClientRect();
        const panelRect = document.querySelector(".donation-hero-copy")!.getBoundingClientRect();
        return { heroTop: heroRect.top, heroBottom: heroRect.bottom, panelTop: panelRect.top, panelBottom: panelRect.bottom };
      });
      expect(hero.panelTop).toBeGreaterThanOrEqual(hero.heroTop);
      expect(hero.panelBottom).toBeLessThanOrEqual(hero.heroBottom);

      await page.goto("/schule/", { waitUntil: "load" });
      const cards = await page.evaluate(() => {
        const sticky = document.querySelector("[data-sticky-navigation]")!.getBoundingClientRect().height;
        return { available: window.innerHeight - sticky, heights: [...document.querySelectorAll(".section-card")].map((card) => card.getBoundingClientRect().height) };
      });
      for (const height of cards.heights) expect(height).toBeLessThanOrEqual(cards.available);
    } finally {
      await context.close();
    }
  });
});

test.describe("rendering regressions, round 5", () => {
  test.beforeEach(async ({ page }) => {
    await installRenderingHelpers(page);
  });

  test("sliders, carousels and icon controls render correctly before the lazy stylesheet arrives", async ({ page }) => {
    await page.route(/style-lazy.*\.css/, (route) => route.abort());
    await dismissDonationPopup(page);
    for (const width of [390, 1280]) {
      await page.setViewportSize({ width, height: 900 });
      for (const route of ["/", "/schule/"]) {
        await page.goto(route, { waitUntil: "load" });
        const sliders = await page.locator(".swiper").evaluateAll((elements) =>
          elements.map((slider) => {
            const top = slider.getBoundingClientRect().top;
            const slides = [...slider.querySelectorAll(":scope > .swiper-wrapper > .swiper-slide")];
            return { stacked: slides.filter((slide) => slide.getBoundingClientRect().top > top + 1).length, overflow: getComputedStyle(slider).overflow };
          }),
        );
        for (const slider of sliders) {
          expect(slider.stacked, `${route} @${width}px stacked slides`).toBe(0);
          expect(slider.overflow, `${route} @${width}px slider overflow`).toMatch(/hidden|clip/);
        }
      }
      const iconSelector = width < 768 ? 'a.fa-bars[href="#mymenu"]' : ".navbar-nav a.fa-utensils";
      const iconWidth = await page.locator(iconSelector).first().evaluate((icon) => icon.getBoundingClientRect().width);
      expect(iconWidth, `${iconSelector} @${width}px`).toBeGreaterThan(8);
      const backToTopIcon = await page.locator("[data-back-to-top] .fa-chevron-up, [data-back-to-top] [class*='fa-']").first().evaluate((icon) => icon.getBoundingClientRect().width);
      expect(backToTopIcon, `back-to-top icon @${width}px`).toBeGreaterThan(6);
    }

    await page.context().clearCookies();
    const popupPage = await page.context().newPage();
    await popupPage.route(/style-lazy.*\.css/, (route) => route.abort());
    await popupPage.goto("/spenden/", { waitUntil: "load" });
    await expect(popupPage.locator("[data-donation-popup]")).toHaveAttribute("open", "");
    const closeIcon = await popupPage.locator(".donation-popup-close .fa-times").evaluate((icon) => icon.getBoundingClientRect().width);
    expect(closeIcon, "popup close icon").toBeGreaterThan(6);
    await popupPage.close();
  });

  test("fonts needed for the first paint are preloaded", async ({ page, request }) => {
    await page.goto("/", { waitUntil: "load" });
    const preloads = await page.locator('link[rel="preload"][as="font"]').evaluateAll((links) => links.map((link) => link.getAttribute("href") || ""));
    for (const font of ["Overpass-Variable.woff2", "PlayfairDisplay-Regular.woff2", "fa-solid-900.woff2"]) {
      const href = preloads.find((candidate) => candidate.endsWith(font));
      expect(href, font).toBeTruthy();
      expect((await request.get(href!)).status(), font).toBe(200);
    }
  });

  test("titles and text columns do not jump when the web fonts arrive", async ({ browser }) => {
    const measure = async (blockFonts: boolean, route: string, width: number) => {
      const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: "reduce" });
      const page = await context.newPage();
      if (blockFonts) await page.route(/(Overpass|PlayfairDisplay)[^/]*\.woff2/, (route) => route.abort());
      await page.goto(route, { waitUntil: "load" });
      await page.evaluate(() => document.fonts.ready);
      const geometry = await page.evaluate(() => {
        const title = document.querySelector("main h1")!.getBoundingClientRect();
        const column = document.querySelector(".article-reading-column, .reading-prose")!.getBoundingClientRect();
        return { titleHeight: title.height, columnLeft: column.left, columnWidth: column.width };
      });
      await context.close();
      return geometry;
    };
    for (const [route, width] of [
      ["/aktuelles/post-1/", 390],
      ["/elternengagement/", 390],
      ["/aktuelles/post-1/", 1280],
      ["/verein/", 1280],
    ] as const) {
      const fallback = await measure(true, route, width);
      const loaded = await measure(false, route, width);
      expect(Math.abs(fallback.titleHeight - loaded.titleHeight), `${route} @${width}px title height`).toBeLessThanOrEqual(2);
      expect(Math.abs(fallback.columnLeft - loaded.columnLeft), `${route} @${width}px column position`).toBeLessThanOrEqual(3);
      expect(Math.abs(fallback.columnWidth - loaded.columnWidth), `${route} @${width}px column width`).toBeLessThanOrEqual(3);
    }
  });

  test("visible content does not fade out again when the script arrives late", async ({ page }) => {
    await dismissDonationPopup(page);
    await page.setViewportSize({ width: 1280, height: 900 });
    for (const route of ["/verein/", "/datenschutz/", "/spenden/"]) {
      await page.route(/\/js\/script[^/]*\.js/, async (route) => {
        await new Promise((resolve) => setTimeout(resolve, 1500));
        await route.continue();
      });
      await page.goto(route, { waitUntil: "domcontentloaded" });
      await page.waitForFunction(() => document.documentElement.classList.contains("js") || document.documentElement.classList.contains("js-late"), undefined, { timeout: 15_000 });
      await page.waitForTimeout(120);
      const hidden = await page.evaluate(() => {
        const inView = (element: Element) => {
          const rect = element.getBoundingClientRect();
          return rect.top < window.innerHeight && rect.bottom > 0 && rect.height > 0;
        };
        const targets = [...document.querySelectorAll("[data-reveal], .donation-hero-copy > *")].filter(inView);
        return targets.filter((element) => Number.parseFloat(getComputedStyle(element).opacity) < 0.99).map((element) => `${element.tagName}.${element.className}`);
      });
      expect(hidden, `${route} visible content faded out`).toEqual([]);
      await page.unroute(/\/js\/script[^/]*\.js/);
    }
  });

  test("donation popup blurs the page behind it in every engine", async ({ page }) => {
    await page.goto("/spenden/", { waitUntil: "load" });
    await expect(page.locator("[data-donation-popup]")).toHaveAttribute("open", "");
    const filters = await page.evaluate(() => ({
      header: getComputedStyle(document.querySelector("[data-sticky-navigation]")!).filter,
      title: getComputedStyle(document.querySelector("main > section")!).filter,
      dialog: getComputedStyle(document.querySelector("[data-donation-popup]")!).filter,
    }));
    expect(filters.header).toContain("blur");
    expect(filters.title).toContain("blur");
    expect(filters.dialog).toBe("none");
    await page.locator("[data-donation-popup-close]").click();
    await expect(page.locator("main > section").first()).toHaveCSS("filter", "none");
  });

  test("keyboard focus cycles inside the donation popup", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/spenden/", { waitUntil: "load" });
    await expect(page.locator("[data-donation-popup]")).toHaveAttribute("open", "");
    for (const key of ["Tab", "Tab", "Tab", "Tab", "Tab", "Shift+Tab", "Shift+Tab", "Shift+Tab"]) {
      await page.keyboard.press(key);
      const state = await page.evaluate(() => {
        const dialog = document.querySelector("[data-donation-popup]")!;
        const active = document.activeElement;
        return { inside: !!active && dialog.contains(active) && active !== dialog, active: active?.tagName };
      });
      expect(state.inside, `focus after ${key} is on ${state.active}`).toBe(true);
    }
  });

  test("page outline labels never leave a short word alone on a line", async ({ page, isMobile }) => {
    test.skip(isMobile, "the outline rail requires a fine pointer");
    await page.setViewportSize({ width: 1280, height: 900 });
    for (const route of ["/datenschutz/", "/schule/", "/impressum/"]) {
      await page.goto(route, { waitUntil: "load" });
      await waitForFonts(page);
      // The rail only appears after the intro slider, so scroll into the content first.
      await page.evaluate(() => {
        document.documentElement.style.scrollBehavior = "auto";
        window.scrollTo(0, document.documentElement.scrollHeight / 3);
      });
      await expect(page.locator("[data-page-outline]")).toBeVisible();
      await page.locator("[data-page-outline]").hover();
      const widows = await page.locator(".page-outline-link").evaluateAll((links) =>
        links
          .filter((link) => {
            const words: { top: number; text: string }[] = [];
            const walker = document.createTreeWalker(link, NodeFilter.SHOW_TEXT);
            let node: Node | null;
            while ((node = walker.nextNode())) {
              for (const match of (node.textContent || "").matchAll(/\S+/g)) {
                const range = document.createRange();
                range.setStart(node, match.index ?? 0);
                range.setEnd(node, (match.index ?? 0) + match[0].length);
                const rect = [...range.getClientRects()].filter((r) => r.width > 0).at(-1);
                if (rect) words.push({ top: Math.round(rect.top / 4), text: match[0] });
              }
            }
            if (words.length < 3) return false;
            const lines = [...new Set(words.map((word) => word.top))].map((top) => words.filter((word) => word.top === top));
            return lines.length > 1 && lines.some((line) => line.length === 1 && line[0].text.length <= 3);
          })
          .map((link) => link.textContent?.trim()),
      );
      expect(widows, route).toEqual([]);
    }
  });
});
