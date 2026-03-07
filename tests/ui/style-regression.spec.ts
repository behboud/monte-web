import { expect, test } from "@playwright/test";

test.describe("style regressions", () => {
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
    await page.goto("/schule/konzept/maria-montessori/zur-person/", {
      waitUntil: "networkidle",
    });

    const trailLink = page.locator(".breadcrumb li a").first();
    const currentItem = page.locator(".breadcrumb > li:last-child span");

    await expect(trailLink).toBeVisible();
    await expect(currentItem).toBeVisible();
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

  test("spenden entries keep consistent media sizing", async ({ page }) => {
    await page.goto("/spenden/", { waitUntil: "networkidle" });

    const media = page.locator("main .container.grid > div:first-child");
    const count = await media.count();
    expect(count).toBeGreaterThan(1);

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
