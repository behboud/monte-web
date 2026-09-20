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
});
