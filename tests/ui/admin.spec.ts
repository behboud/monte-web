import { expect, test } from "@playwright/test";

test.describe("EmDash admin", () => {
  test("health endpoint reports the running CMS", async ({ request }) => {
    const response = await request.get("/_emdash/api/health");

    await expect(response).toBeOK();
    expect(await response.json()).toMatchObject({
      success: true,
      data: { product: "emdash" },
    });
  });

  test("admin shell loads for first-run setup or an existing editor", async ({ page }) => {
    const response = await page.goto("/_emdash/admin/", { waitUntil: "domcontentloaded" });

    expect(response?.status()).toBe(200);
    await expect(page).toHaveTitle("EmDash Admin");
    await expect(page.locator('[role="img"][aria-label="EmDash"]')).toBeVisible();
    await expect(page.locator("body")).toContainText(/Set up your site|Sign in|Dashboard|Content|Richte deine Website ein|Melde dich bei deiner Website an|Anmelden|Inhalte/);
  });

  test("legacy admin URL redirects to EmDash", async ({ page }) => {
    await page.goto("/admin/", { waitUntil: "domcontentloaded" });

    await expect(page).toHaveURL((url) => url.pathname.startsWith("/_emdash/admin"));
    await expect(page).toHaveTitle("EmDash Admin");
  });

  test("migrated local logo and favicon assets remain available", async ({ request }) => {
    for (const path of [
      "/images/logo_20_jahre_140mm_400dpi.png",
      "/images/favicon-96x96.png",
    ]) {
      const response = await request.get(path);
      await expect(response).toBeOK();
      expect(response.headers()["content-type"]).toMatch(/^image\/png/);
    }
  });
});
