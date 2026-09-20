import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, readdirSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, relative } from "node:path";
import { expect, test } from "@playwright/test";

const deploymentBaseURL = new URL(process.env.TEST_DEPLOYMENT_BASE_URL ?? "https://example.test/site-prefix/");
const linkAttributePattern = /\b(?:href|src)=(?:"([^"]*)"|'([^']*)'|([^\s>]+))/gi;
const cssURLPattern = /url\(\s*(?:"([^"]*)"|'([^']*)'|([^)]*))\s*\)/gi;

const findFiles = (directory: string, predicate: (path: string) => boolean): string[] =>
  readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return findFiles(path, predicate);
    return predicate(path) ? [path] : [];
  });

const findHTMLFiles = (directory: string): string[] => findFiles(directory, (path) => path.endsWith(".html"));

const pageURLForFile = (file: string, destination: string): URL => {
  const outputPath = relative(destination, file).replaceAll("\\", "/");
  if (outputPath === "index.html") return deploymentBaseURL;
  if (outputPath.endsWith("/index.html")) {
    return new URL(outputPath.slice(0, -"index.html".length), deploymentBaseURL);
  }
  return new URL(outputPath, deploymentBaseURL);
};

const outputPathForURL = (url: URL, destination: string): string | null => {
  const basePath = deploymentBaseURL.pathname;
  const basePathWithoutTrailingSlash = basePath.slice(0, -1);
  if (url.origin !== deploymentBaseURL.origin) return null;
  if (url.pathname === basePathWithoutTrailingSlash) return join(destination, "index.html");
  if (!url.pathname.startsWith(basePath)) return null;

  const path = decodeURIComponent(url.pathname.slice(basePath.length));
  const candidates = [path, `${path}/`, `${path}.html`, `${path}/index.html`].map((candidate) => join(destination, candidate));

  return (
    candidates.find((candidate) => {
      try {
        return statSync(candidate).isFile();
      } catch {
        return false;
      }
    }) ?? null
  );
};

test("production internal links stay under the deployment base path", ({}, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-chromium", "The generated-link contract runs once.");

  const destination = mkdtempSync(join(tmpdir(), "monte-public-links-"));
  try {
    execFileSync(process.env.HUGO_BIN ?? "hugo", ["--gc", "--minify", "--baseURL", deploymentBaseURL.toString(), "--destination", destination], { stdio: "ignore" });

    const invalidLinks: string[] = [];
    for (const file of findHTMLFiles(destination)) {
      const pageURL = pageURLForFile(file, destination);
      const html = readFileSync(file, "utf8");
      for (const match of html.matchAll(linkAttributePattern)) {
        const rawURL = match[1] ?? match[2] ?? match[3] ?? "";
        if (!rawURL || rawURL.startsWith("#") || /^(?:data|javascript|mailto|tel):/i.test(rawURL)) continue;

        const resolvedURL = new URL(rawURL, pageURL);
        const target = outputPathForURL(resolvedURL, destination);
        if (resolvedURL.origin === deploymentBaseURL.origin && !target) {
          invalidLinks.push(`${relative(destination, file)} -> ${rawURL}`);
        }
      }
    }

    expect(invalidLinks).toEqual([]);
  } finally {
    rmSync(destination, { recursive: true, force: true });
  }
});

test("production CSS assets stay under the deployment base path", ({}, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-chromium", "The generated-asset contract runs once.");

  const destination = mkdtempSync(join(tmpdir(), "monte-public-assets-"));
  try {
    execFileSync(process.env.HUGO_BIN ?? "hugo", ["--gc", "--minify", "--baseURL", deploymentBaseURL.toString(), "--destination", destination], { stdio: "ignore" });

    const invalidAssets: string[] = [];
    for (const file of findFiles(destination, (path) => path.endsWith(".css"))) {
      const cssURL = new URL(relative(destination, file).replaceAll("\\\\", "/"), deploymentBaseURL);
      const css = readFileSync(file, "utf8");
      for (const match of css.matchAll(cssURLPattern)) {
        const rawURL = (match[1] ?? match[2] ?? match[3] ?? "").trim();
        if (!rawURL || /^(?:data|https?:|#)/i.test(rawURL)) continue;

        const resolvedURL = new URL(rawURL, cssURL);
        if (resolvedURL.origin === deploymentBaseURL.origin && !resolvedURL.pathname.startsWith(deploymentBaseURL.pathname)) {
          invalidAssets.push(`${relative(destination, file)} -> ${rawURL}`);
        }
      }
    }

    expect(invalidAssets).toEqual([]);
  } finally {
    rmSync(destination, { recursive: true, force: true });
  }
});
