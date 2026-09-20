import { expect, test } from "@playwright/test";

test.describe("CMS admin", () => {
  test("loads the pinned Sveltia CMS and its configuration", async ({ page, request }) => {
    const configResponse = await request.get("/admin/config.yml");
    await expect(configResponse).toBeOK();
    expect(await configResponse.text()).toMatch(/collections:/);

    await page.goto("/admin/", { waitUntil: "domcontentloaded" });

    const cmsScript = page.locator('script[src*="@sveltia/cms@"]');
    await expect(cmsScript).toHaveCount(1);
    await expect(cmsScript).toHaveAttribute("src", "https://unpkg.com/@sveltia/cms@0.217.0/dist/sveltia-cms.js");
    await expect(page.getByRole("button", { name: /GitHub/ })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(/Sveltia CMS/)).toBeVisible();
  });

  test("optimizes uploaded images before storing them", async ({ request }) => {
    const configResponse = await request.get("/admin/config.yml");
    const config = await configResponse.text();

    expect(config).toMatch(/media_libraries:\s+all:\s+transformations:\s+raster_image:\s+format: webp\s+quality: 82\s+width: 2048\s+height: 2048/);
    expect(config).toContain("optimize: true");
  });

  test("CMS logo points to an existing anniversary logo", async ({ request }) => {
    const configResponse = await request.get("/admin/config.yml");
    const config = await configResponse.text();
    const logoUrl = config.match(/^logo_url:\s*([^\n]+)$/m)?.[1]?.trim();

    expect(logoUrl).toBe("/monte-web/images/logo_20_jahre_140mm_400dpi.png");

    const localLogoPath = logoUrl.replace(/^\/monte-web/, "");
    const logoResponse = await request.get(localLogoPath);
    expect(logoResponse).toBeOK();
    expect(logoResponse.headers()["content-type"]).toMatch(/^image\/png/);
  });

  test("CMS serves a local favicon instead of falling back to the domain root", async ({ request }) => {
    const adminResponse = await request.get("/admin/");
    const adminHtml = await adminResponse.text();

    expect(adminHtml).toContain('<link rel="icon" href="./favicon.png" type="image/png" />');

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

    await page.goto("/spenden/", { waitUntil: "networkidle" });
    await expect(page.getByText("Privater Spender", { exact: true })).toBeVisible();
  });
});
