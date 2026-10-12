import { expect, test } from "@playwright/test";

test("self-hosted fonts resolve under the deployment prefix", async ({ request }) => {
  const response = await request.get("/css/site.css");
  await expect(response).toBeOK();

  const css = await response.text();
  const fontPaths = [...css.matchAll(/url\((?:["']?)([^"')]+\.woff2)(?:["']?)\)/g)]
    .map((match) => match[1])
    .filter((path) => path && !path.startsWith("data:"));

  expect(fontPaths.length).toBeGreaterThan(0);
  for (const fontPath of fontPaths) {
    expect(fontPath.startsWith("/")).toBe(false);
    expect(new URL(fontPath, "http://localhost/monte-web/css/site.css").pathname).toMatch(/^\/monte-web\/fonts\//);

    const assetPath = new URL(fontPath, "http://localhost/css/site.css").pathname;
    const fontResponse = await request.get(assetPath);
    await expect(fontResponse).toBeOK();
  }
});
