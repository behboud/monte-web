import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const publicDir = path.join(repoRoot, "public");
const sitemapPath = path.join(publicDir, "sitemap.xml");
const outputDir = path.join(repoRoot, "tests", "ui", "fixtures");
const outputPath = path.join(outputDir, "routes.json");

if (!fs.existsSync(sitemapPath)) {
  throw new Error(`Missing sitemap: ${sitemapPath}. Build the site first.`);
}

const xml = fs.readFileSync(sitemapPath, "utf8");
const locationMatches = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)];

const routes = locationMatches
  .map((match) => {
    try {
      const parsed = new URL(match[1]);
      const pathname = parsed.pathname;
      if (!pathname || pathname.includes(".xml") || pathname.includes(".json")) {
        return null;
      }
      return pathname;
    } catch {
      return null;
    }
  })
  .filter(Boolean)
  .map((pathname) => pathname.replace(/^\/monte-web(?=\/|$)/, "") || "/");

routes.push("/404.html");

const uniqueRoutes = [...new Set(routes)].sort((a, b) => a.localeCompare(b, "de"));

fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(uniqueRoutes, null, 2)}\n`);

console.log(`Generated ${uniqueRoutes.length} routes at ${outputPath}`);
