import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, resolve, sep } from "node:path";
import { isDeepStrictEqual, parseArgs } from "node:util";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const cliPath = resolve(root, "node_modules/.bin/emdash");
const { values } = parseArgs({
  options: {
    url: { type: "string" },
    database: { type: "string", default: "./data.db" },
    "uploads-dir": { type: "string" },
    "ignore-drafts": { type: "boolean", default: false },
  },
  strict: true,
});

if (!values.url) throw new Error("Pass the local EmDash URL with --url");
const siteUrl = new URL(values.url);
if (siteUrl.protocol !== "http:" || siteUrl.hostname !== "localhost") {
  throw new Error("This migration only writes to an EmDash server on localhost");
}

const databasePath = resolve(root, values.database);
if (values["uploads-dir"]) process.env.EMDASH_UPLOADS_DIR = resolve(root, values["uploads-dir"]);
const seedPath = resolve(root, "seed/seed.json");
const seed = JSON.parse(await readFile(seedPath, "utf8"));

function runCli(args) {
  try {
    return execFileSync(cliPath, args, {
      cwd: root,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
  } catch (error) {
    const output = [error.stderr, error.stdout]
      .map((part) => (typeof part === "string" ? part.trim() : ""))
      .filter(Boolean)
      .join("\n");
    throw new Error(output || error.message, { cause: error });
  }
}

function runJson(args) {
  return JSON.parse(runCli([...args, "--url", siteUrl.origin, "--json"]));
}

function listItems(collection) {
  const items = [];
  let cursor;
  do {
    const result = runJson(["content", "list", collection, "--limit", "100", ...(cursor ? ["--cursor", cursor] : [])]);
    items.push(...(result.items ?? []));
    cursor = result.nextCursor;
  } while (cursor);
  return items;
}

let devBypassCookie;
async function emdashApiRequest(path, method = "GET") {
  const headers = new Headers();
  if (process.env.EMDASH_TOKEN) {
    headers.set("Authorization", `Bearer ${process.env.EMDASH_TOKEN}`);
  } else {
    if (!devBypassCookie) {
      const response = await fetch(new URL("/_emdash/api/auth/dev-bypass", siteUrl.origin), { redirect: "manual" });
      const setCookie = response.headers.get("set-cookie");
      devBypassCookie = setCookie?.split(";", 1)[0];
      await response.text();
      if (!devBypassCookie) {
        throw new Error("Cannot establish local EmDash dev-bypass authentication; set EMDASH_TOKEN or enable local dev bypass");
      }
    }
    headers.set("Cookie", devBypassCookie);
  }
  if (method !== "GET") {
    headers.set("Origin", siteUrl.origin);
    headers.set("X-EmDash-Request", "1");
  }

  const response = await fetch(new URL(path, siteUrl.origin), { method, headers });
  const body = await response.text();
  let result;
  try {
    result = JSON.parse(body);
  } catch {
    throw new Error(`EmDash API ${method} ${path} returned non-JSON (${response.status}): ${body}`);
  }
  if (!response.ok || result.success === false) {
    throw new Error(`EmDash API ${method} ${path} failed (${response.status}): ${result.error?.message ?? body}`);
  }
  return result.data;
}

async function listTrashedItems(collection) {
  const items = [];
  let cursor;
  do {
    const query = new URLSearchParams({ limit: "100" });
    if (cursor) query.set("cursor", cursor);
    const result = await emdashApiRequest(`/_emdash/api/content/${encodeURIComponent(collection)}/trash?${query}`);
    items.push(...(result.items ?? []));
    cursor = result.nextCursor;
  } while (cursor);
  return items;
}

// The CLI's delete command only trashes entries; use EmDash's permanent-delete API so it also clears revisions and related metadata.
async function permanentlyDeleteContent(collection, id) {
  return emdashApiRequest(
    `/_emdash/api/content/${encodeURIComponent(collection)}/${encodeURIComponent(id)}/permanent`,
    "DELETE",
  );
}

function countContentRevisions(collection) {
  const escapedCollection = collection.replaceAll("'", "''");
  const count = execFileSync(
    "sqlite3",
    ["-readonly", databasePath, `SELECT COUNT(*) FROM revisions WHERE collection = '${escapedCollection}'`],
    { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
  ).trim();
  const parsed = Number(count);
  if (!Number.isInteger(parsed)) throw new Error(`Could not count ${collection} revisions in ${databasePath}`);
  return parsed;
}

// Schema deletion drops the legacy content table but does not remove its revision rows.
// Only call this after the raw SQLite backup, and only for the explicitly retired collections.
function purgeOrphanedRevisions(collection) {
  const count = countContentRevisions(collection);
  if (count === 0) return 0;
  const escapedCollection = collection.replaceAll("'", "''");
  execFileSync(
    "sqlite3",
    [databasePath, `BEGIN IMMEDIATE; DELETE FROM revisions WHERE collection = '${escapedCollection}'; COMMIT;`],
    { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
  );
  if (countContentRevisions(collection) !== 0) {
    throw new Error(`Orphaned ${collection} revisions remain after cleanup`);
  }
  console.log(`Removed ${count} orphaned ${collection} revisions`);
  return count;
}

const ignoredDrafts = new Set();

function getItem(collection, id) {
  const item = runJson(["content", "get", collection, id, "--raw", "--published"]);
  if (item.status !== "published") {
    throw new Error(`${collection}/${item.slug} has no published revision to migrate`);
  }
  if (item.draftRevisionId) {
    if (!values["ignore-drafts"]) {
      throw new Error(`Publish or resolve the draft for ${collection}/${item.slug} before migration, or pass --ignore-drafts to migrate its published revision only`);
    }
    ignoredDrafts.add(`${collection}/${item.slug}`);
  }
  if (typeof item._rev !== "string") throw new Error(`${collection}/${item.slug} has no revision token`);
  return item;
}

function isTransientServerError(error) {
  return /internal server error|ECONNREFUSED|fetch failed|socket|timed out|Vite module runner has been closed/i.test(error instanceof Error ? error.message : String(error));
}

function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function text(value) {
  return typeof value === "string" ? value : "";
}

function repeater(value, label = "Repeater") {
  if (value == null) return [];
  if (!Array.isArray(value) || value.some((item) => !isRecord(item))) {
    throw new Error(`${label} is not a valid list of objects`);
  }
  return value;
}

function safeFilename(value) {
  return String(value).replace(/[^a-z0-9_-]/gi, "-");
}

function schemaField(collection, slug) {
  return collection?.fields?.find((field) => field.slug === slug);
}

function collectionSchema(collections, slug) {
  return collections.find((collection) => collection.slug === slug);
}

function readAllCollectionSchemas() {
  return runJson(["schema", "list"]).map((collection) => runJson(["schema", "get", collection.slug]));
}

function decodePathname(value) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function localImagePath(value) {
  if (typeof value !== "string" || !value.trim()) return null;
  let pathname;
  try {
    const parsed = new URL(value, "http://localhost");
    pathname = parsed.pathname;
    if (parsed.hostname === "raw.githubusercontent.com") {
      const assetPrefix = "/assets/images/";
      const assetStart = pathname.indexOf(assetPrefix);
      if (assetStart !== -1) pathname = `/images/${pathname.slice(assetStart + assetPrefix.length)}`;
    }
  } catch {
    pathname = value.split(/[?#]/, 1)[0];
  }
  pathname = decodePathname(pathname).replace(/^\/monte-web(?=\/images\/)/, "");
  if (!pathname.startsWith("/images/")) return null;
  const roots = [resolve(root, "seed/source"), resolve(root, "static")];
  const files = roots.map((imageRoot) => {
    const file = resolve(imageRoot, pathname.slice(1));
    if (!file.startsWith(`${imageRoot}${sep}`)) {
      throw new Error(`Image path escapes the local asset directory: ${value}`);
    }
    return file;
  });
  return { key: pathname, files };
}

function collectImageSources(value, result = new Map(), optional = false) {
  if (Array.isArray(value)) {
    for (const item of value) collectImageSources(item, result, optional);
    return result;
  }
  if (!isRecord(value)) return result;

  const alt = text(value.title);
  const add = (source, imageAlt, mayBeMissing) => {
    if (source.startsWith("/_emdash/api/media/file/")) return;
    const previous = result.get(source);
    result.set(source, {
      alt: previous?.alt || imageAlt,
      optional: previous ? previous.optional && mayBeMissing : mayBeMissing,
    });
  };
  for (const key of ["image_url", "featured_image"]) {
    if (typeof value[key] === "string" && value[key]) add(value[key], alt, optional);
  }
  if (value._type === "image" && isRecord(value.asset)) {
    const source = text(value.asset.url || value.asset.src);
    if (source) add(source, text(value.alt) || alt, optional);
  }

  for (const [key, child] of Object.entries(value)) {
    collectImageSources(child, result, optional || key === "slides");
  }
  return result;
}

function mediaList() {
  const items = [];
  let cursor;
  do {
    const result = runJson(["media", "list", "--limit", "100", ...(cursor ? ["--cursor", cursor] : [])]);
    items.push(...(result.items ?? []));
    cursor = result.nextCursor;
  } while (cursor);
  return items;
}

function contentHash(bytes) {
  return `sha1:${createHash("sha1").update(bytes).digest("hex")}`;
}

function checkedMediaItem(value) {
  const item = isRecord(value) && isRecord(value.item) ? value.item : value;
  if (!isRecord(item) || typeof item.id !== "string" || typeof item.storageKey !== "string") {
    throw new Error("EmDash did not return a Media item with an id and storage key");
  }
  if (item.status && item.status !== "ready") {
    throw new Error(`Media item ${item.id} is not ready (${item.status})`);
  }
  return item;
}

function imageValue(item, alt) {
  const result = {
    provider: "local",
    id: item.id,
    filename: item.filename,
    mimeType: item.mimeType,
    meta: { storageKey: item.storageKey },
  };
  if (typeof item.width === "number") result.width = item.width;
  if (typeof item.height === "number") result.height = item.height;
  if (typeof alt === "string") result.alt = alt;
  else if (typeof item.alt === "string") result.alt = item.alt;
  return result;
}

function mediaFileUrl(storageKey) {
  const safeSegments = storageKey.split("/").map(encodeURIComponent).join("/");
  return `/_emdash/api/media/file/${safeSegments}`;
}

function portableTextImage(item, block) {
  const alt = typeof block.alt === "string" ? block.alt : "";
  const next = {
    ...block,
    asset: {
      _ref: item.id,
      url: mediaFileUrl(item.storageKey),
      provider: "local",
    },
    alt,
  };
  if (typeof next.width !== "number" && typeof item.width === "number") next.width = item.width;
  if (typeof next.height !== "number" && typeof item.height === "number") next.height = item.height;
  return next;
}

function canonicalSource(source) {
  return localImagePath(source)?.key ?? source;
}

function imageReference(source, mediaBySource, alt, missingSources = new Set()) {
  if (typeof source !== "string" || !source) return undefined;
  const key = canonicalSource(source);
  if (missingSources.has(key)) return undefined;
  const item = mediaBySource.get(key);
  if (!item) throw new Error(`Image was not uploaded to EmDash Media: ${source}`);
  return imageValue(item, alt);
}

function transformPortableTextImage(block, mediaBySource) {
  if (!isRecord(block.asset)) throw new Error("Portable Text image block has no asset object");
  const source = text(block.asset.url || block.asset.src);
  const localPath = localImagePath(source);
  if (!localPath) {
    if (block.asset.provider && block.asset.provider !== "local") return block;
    if (source.startsWith("/_emdash/api/media/file/")) return block;
    if (source && !mediaBySource.has(canonicalSource(source))) {
      throw new Error(`Portable Text image is not a repository media path: ${source}`);
    }
    return block;
  }
  const item = mediaBySource.get(localPath.key);
  if (!item) throw new Error(`Image was not uploaded to EmDash Media: ${source}`);
  return portableTextImage(item, block);
}

function transformPortableTextNode(value, mediaBySource) {
  if (Array.isArray(value)) return value.map((item) => transformPortableTextNode(item, mediaBySource));
  if (!isRecord(value)) return value;
  if (value._type === "image") return transformPortableTextImage(value, mediaBySource);
  return Object.fromEntries(
    Object.entries(value).map(([key, child]) => [key, transformPortableTextNode(child, mediaBySource)]),
  );
}

function transformPortableText(value, mediaBySource) {
  if (value == null) return [];
  if (!Array.isArray(value) || value.some((block) => !isRecord(block))) {
    throw new Error("Portable Text value is not a valid list of blocks");
  }
  return value.map((block) => transformPortableTextNode(block, mediaBySource));
}

function slugifyHeading(value) {
  return String(value ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function textOfHeading(block) {
  if (!Array.isArray(block.children)) return "";
  return block.children.map((child) => (isRecord(child) ? text(child.text) : "")).join("");
}

function headingId(title, occurrences) {
  const base = slugifyHeading(title) || "section";
  const occurrence = (occurrences.get(base) ?? 0) + 1;
  occurrences.set(base, occurrence);
  return occurrence === 1 ? base : `${base}-${occurrence}`;
}

function escapeAttribute(value) {
  return String(value).replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

function safeAnchorId(value, fallback) {
  const raw = text(value).trim() || fallback;
  return /^[A-Za-z][A-Za-z0-9_-]*$/.test(raw) ? raw : slugifyHeading(raw) || fallback;
}

function makeHeading(title, level, key) {
  return {
    _type: "block",
    _key: key,
    style: `h${Math.max(1, Math.min(level, 6))}`,
    markDefs: [],
    children: [{ _type: "span", _key: `${key}:span`, text: title, marks: [] }],
  };
}

function makeAnchorBlock(id, key) {
  return {
    _type: "htmlBlock",
    _key: `${key}:anchor`,
    html: `<span id="${escapeAttribute(id)}"></span>`,
  };
}

function pageBodyFromLegacy(page, mediaBySource, missingSources) {
  const blocks = page.data.page_content;
  if (!Array.isArray(blocks)) {
    if (blocks != null) throw new Error(`Page ${page.slug} has malformed page_content`);
    return transformPortableText(page.data.body, mediaBySource);
  }

  const output = [];
  const occurrences = new Map();
  let sectionIndex = 0;
  const appendText = (content) => {
    for (const block of transformPortableText(content, mediaBySource)) {
      if (isRecord(block) && block._type === "block" && /^h[1-6]$/.test(text(block.style))) {
        headingId(textOfHeading(block), occurrences);
      }
      output.push(block);
    }
  };

  for (const block of blocks) {
    if (!isRecord(block) || typeof block._type !== "string") {
      throw new Error(`Page ${page.slug} has a malformed page_content block`);
    }
    if (block._type === "page_text") {
      appendText(block.content);
      continue;
    }
    if (block._type !== "page_section") {
      throw new Error(`Page ${page.slug} contains unsupported page_content block "${block._type}"`);
    }

    const title = text(block.title).trim();
    if (!title) throw new Error(`Page ${page.slug} has a section without a heading`);
    const key = `migration:${page.slug}:${text(block._key) || sectionIndex}`;
    const image = imageReference(block.image_url, mediaBySource, title, missingSources);
    if (image) {
      const item = mediaBySource.get(canonicalSource(block.image_url));
      output.push({
        _type: "image",
        _key: `${key}:image`,
        asset: {
          _ref: item.id,
          url: mediaFileUrl(item.storageKey),
          provider: "local",
        },
        alt: title,
        alignment: "full",
        ...(typeof item.width === "number" ? { width: item.width } : {}),
        ...(typeof item.height === "number" ? { height: item.height } : {}),
      });
    }

    const level = block.heading_level === "Subsection" ? 3 : block.heading_level === "Detail" ? 4 : 2;
    const heading = makeHeading(title, level, `${key}:heading`);
    const generatedId = headingId(title, occurrences);
    const oldId = safeAnchorId(block.anchor_id, slugifyHeading(title) || `section-${sectionIndex + 1}`);
    if (oldId !== generatedId) output.push(makeAnchorBlock(oldId, key));
    output.push(heading);
    appendText(block.content);
    sectionIndex++;
  }
  return output;
}

function pageUpdate(page, mediaBySource, missingSources) {
  const body = pageBodyFromLegacy(page, mediaBySource, missingSources);
  if (page.data.body != null) {
    const existingBody = transformPortableText(page.data.body, mediaBySource);
    if (!isDeepStrictEqual(existingBody, body)) {
      throw new Error(`Pages/${page.slug}.body already contains different content; review it before migration`);
    }
  }
  const slides = repeater(page.data.slides, `Pages.${page.slug}.slides`).map((row) => {
    const source = typeof row.image === "string" ? row.image : text(row.image_url);
    const image = isRecord(row.image) && typeof row.image.id === "string"
      ? row.image
      : imageReference(source, mediaBySource, "", missingSources);
    return { image: image ?? null };
  });
  const sectionCards = repeater(page.data.section_cards, `Pages.${page.slug}.section_cards`).map((row) => {
    const source = typeof row.image === "string" ? row.image : text(row.image_url);
    const title = text(row.title);
    const image = isRecord(row.image) && typeof row.image.id === "string"
      ? row.image
      : imageReference(source, mediaBySource, title, missingSources);
    return {
      title,
      description: text(row.description),
      image: image ?? null,
      href: text(row.href),
    };
  });
  return { body, slides, section_cards: sectionCards };
}

function itemUpdate(collection, item, mediaBySource) {
  const data = item.data;
  if (collection === "pages") return pageUpdate(item, mediaBySource);

  const patch = {};
  if (collection === "posts") {
    const source = typeof data.image === "string" ? data.image : text(data.featured_image);
    const image = isRecord(data.image) && typeof data.image.id === "string" ? data.image : imageReference(source, mediaBySource, text(data.title));
    if (image) patch.image = image;
    if (Array.isArray(data.body)) patch.body = transformPortableText(data.body, mediaBySource);
    return patch;
  }

  const source = typeof data.image === "string" ? data.image : text(data.image_url);
  const image = isRecord(data.image) && typeof data.image.id === "string" ? data.image : imageReference(source, mediaBySource, text(data.title));
  if (image) patch.image = image;
  if (Array.isArray(data.content)) patch.content = transformPortableText(data.content, mediaBySource);
  return patch;
}

function migrationComparable(value) {
  if (Array.isArray(value)) return value.map(migrationComparable);
  if (!isRecord(value)) return value;

  if (
    typeof value.id === "string" &&
    value.provider === "local" &&
    isRecord(value.meta) &&
    typeof value.meta.storageKey === "string"
  ) {
    return {
      __mediaReference: value.id,
      storageKey: value.meta.storageKey,
      filename: value.filename,
      mimeType: value.mimeType,
      width: typeof value.width === "number" ? value.width : null,
      height: typeof value.height === "number" ? value.height : null,
    };
  }

  if (value._type === "image" && isRecord(value.asset)) {
    return {
      ...Object.fromEntries(Object.entries(value).filter(([key]) => key !== "asset")),
      asset: {
        _ref: value.asset._ref ?? value.asset.id,
        url: value.asset.url,
        provider: value.asset.provider,
      },
    };
  }

  return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, migrationComparable(child)]));
}

function donationDataFromProject(project, mediaBySource) {
  const source = project.data;
  const patch = itemUpdate("projects", project, mediaBySource);
  return {
    title: text(source.title),
    sort_order: typeof source.sort_order === "number" && Number.isFinite(source.sort_order) ? source.sort_order : 0,
    ...(patch.image ? { image: patch.image } : {}),
    content: patch.content ?? transformPortableText(source.content, mediaBySource),
    highlight: source.highlight === true || source.highlight === 1,
    url: text(source.url),
  };
}

function normalizedDonation(data) {
  return migrationComparable({
    title: text(data?.title),
    sort_order: typeof data?.sort_order === "number" && Number.isFinite(data.sort_order) ? data.sort_order : 0,
    image: data?.image ?? null,
    content: Array.isArray(data?.content) ? data.content : [],
    highlight: data?.highlight === true || data?.highlight === 1,
    url: text(data?.url),
  });
}

function patchMatches(data, patch) {
  return Object.entries(patch).every(([key, value]) =>
    isDeepStrictEqual(migrationComparable(data?.[key]), migrationComparable(value)),
  );
}

async function updateEntry(collection, snapshot, patch, dataFile) {
  const current = getItem(collection, snapshot.id);
  if (patchMatches(current.data, patch)) return current;
  if (current._rev !== snapshot._rev) {
    throw new Error(`${collection}/${snapshot.slug} changed during migration. Review it before continuing`);
  }

  await writeFile(dataFile, JSON.stringify(patch, null, 2));
  const args = ["content", "update", collection, snapshot.id, "--rev", snapshot._rev, "--file", dataFile];

  for (let attempt = 0; attempt < 5; attempt++) {
    let updateError;
    try {
      runJson(args);
    } catch (error) {
      updateError = error;
    }

    let latest;
    try {
      latest = getItem(collection, snapshot.id);
    } catch (error) {
      if (!updateError || isTransientServerError(updateError)) updateError = error;
    }

    if (latest) {
      if (patchMatches(latest.data, patch)) return latest;
      if (latest._rev !== snapshot._rev) {
        throw new Error(`${collection}/${snapshot.slug} changed during migration. Review it before continuing`);
      }
      if (!updateError) throw new Error(`Content verification failed for ${collection}/${snapshot.slug}`);
    }

    if (!updateError || !isTransientServerError(updateError)) throw updateError;
    if (attempt === 4) {
      throw new Error(`EmDash did not recover while updating ${collection}/${snapshot.slug}. Restart the local server and rerun this migration; it is safe to resume.`, { cause: updateError });
    }
    console.warn(`EmDash is refreshing. Retrying ${collection}/${snapshot.slug}`);
    await new Promise((resolve) => setTimeout(resolve, 500 * (attempt + 1)));
  }

  throw new Error(`Content update failed for ${collection}/${snapshot.slug}`);
}

async function ensureDonation(donation, dataFile) {
  await writeFile(dataFile, JSON.stringify(donation.data, null, 2));
  for (let attempt = 0; attempt < 5; attempt++) {
    let creationError;
    try {
      const existing = listItems("donations").find((item) => item.slug === donation.slug);
      if (existing) {
        const current = getItem("donations", existing.id);
        if (current.locale !== donation.locale) {
          throw new Error(`Donations/${donation.slug} already exists in locale ${current.locale}; expected ${donation.locale}. Review it before changing Projects.`);
        }
        if (!isDeepStrictEqual(normalizedDonation(current.data), normalizedDonation(donation.data))) {
          throw new Error(`Donations/${donation.slug} already exists with different data. Review it before changing Projects.`);
        }
        return { item: current, created: false };
      }
    } catch (error) {
      if (!isTransientServerError(error)) throw error;
      creationError = error;
    }

    try {
      runJson(["content", "create", "donations", "--slug", donation.slug, "--locale", donation.locale, "--file", dataFile]);
    } catch (error) {
      creationError = error;
    }

    try {
      const existing = listItems("donations").find((item) => item.slug === donation.slug);
      if (existing) {
        const current = getItem("donations", existing.id);
        if (current.locale !== donation.locale || !isDeepStrictEqual(normalizedDonation(current.data), normalizedDonation(donation.data))) {
          throw new Error(`Donations/${donation.slug} failed read-back verification.`);
        }
        return { item: current, created: true };
      }
    } catch (error) {
      if (!creationError || isTransientServerError(creationError)) creationError = error;
      else throw creationError;
    }

    if (creationError && !isTransientServerError(creationError)) throw creationError;
    if (attempt === 4) {
      throw new Error(`EmDash did not recover while creating Donations/${donation.slug}. Restart the local server and rerun this migration; it is safe to resume.`, { cause: creationError });
    }
    console.warn(`EmDash is refreshing. Retrying Donations/${donation.slug}`);
    await new Promise((resolve) => setTimeout(resolve, 500 * (attempt + 1)));
  }

  throw new Error(`Could not create Donations/${donation.slug}`);
}

function dateKey(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return text(value).slice(0, 10);
  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "Europe/Berlin",
  }).format(date);
}

function formatWeekStart(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return text(value);
  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "Europe/Berlin",
  }).format(date);
}

function mealPlanFromPage(page) {
  const days = repeater(page?.data?.meal_days, "Pages.speiseplan.meal_days").map((day) => ({
    date: text(day.date),
    main: text(day.main),
    side: text(day.side),
    dessert: text(day.dessert),
    drink: text(day.drink),
  }));
  if (days.length === 0) return null;
  const weekStart = days
    .map((day) => day.date)
    .filter(Boolean)
    .toSorted()[0];
  if (!weekStart) throw new Error("Speiseplan has meal days but no valid start date");
  const slug = `week-of-${dateKey(weekStart)}`;
  return {
    id: slug,
    slug,
    status: "published",
    data: {
      title: `Speiseplan ab ${formatWeekStart(weekStart)}`,
      week_start: weekStart,
      days,
      notes: repeater(page.data.meal_notes, "Pages.speiseplan.meal_notes").map((row) => ({ note: text(row.note) })),
    },
  };
}

function normalizedMealPlan(data) {
  return {
    week_start: dateKey(data?.week_start),
    days: repeater(data?.days).map((day) => ({
      date: dateKey(day.date),
      main: text(day.main),
      side: text(day.side),
      dessert: text(day.dessert),
      drink: text(day.drink),
    })),
    notes: repeater(data?.notes).map((row) => text(row.note)),
  };
}

function donationMenuFromPage(page) {
  return repeater(page?.data?.top_buttons).map((button) => ({
    type: "custom",
    label: text(button.label),
    url: text(button.url),
    cssClasses: button.style === "primary" ? "spenden-cta-primary" : "spenden-cta-secondary",
  }));
}

function normalizedActionUrl(value) {
  const url = text(value);
  if (/^(?:https?:|mailto:|tel:|\/\/)/i.test(url)) return url;
  return url.replace(/\/+$/, "") || "/";
}

function normalizedMenuItems(items) {
  return (Array.isArray(items) ? items : []).map((item) => ({
    label: text(item.label),
    url: normalizedActionUrl(item.url ?? item.customUrl),
    cssClasses: text(item.cssClasses),
    target: text(item.target),
    children: normalizedMenuItems(item.children),
  }));
}

function normalizedExpectedMenu(items) {
  return items.map((item) => ({
    label: item.label,
    url: normalizedActionUrl(item.url),
    cssClasses: item.cssClasses,
    target: "",
    children: [],
  }));
}

function socialProfilesFromPage(page) {
  const allowed = new Set(["twitter", "github", "facebook", "instagram", "linkedin", "youtube"]);
  const profiles = {};
  for (const row of repeater(page?.data?.social_links)) {
    const key = text(row.name).trim().toLowerCase();
    const value = text(row.url || row.link).trim();
    if (allowed.has(key) && value) profiles[key] = value;
  }
  return profiles;
}

function legacyFieldsFromSchema(collections) {
  const legacy = {
    pages: ["page_content", "template", "toc_enabled", "toc_title", "show_section_cards", "top_buttons", "meal_days", "meal_notes", "social_links"],
    posts: ["featured_image"],
    supporters: ["image_url"],
  };
  return Object.entries(legacy).flatMap(([collectionSlug, fields]) => {
    const collection = collectionSchema(collections, collectionSlug);
    return fields.filter((slug) => schemaField(collection, slug)).map((slug) => [collectionSlug, slug]);
  });
}

function emptyValue(value) {
  return value == null || value === false || value === "" || (Array.isArray(value) && value.length === 0);
}

function isEmptyAktuellesStub(page) {
  if (!page || page.slug !== "aktuelles") return false;
  const data = page.data;
  return (
    text(data.title) === "Aktuelles" &&
    ["", "this is meta description"].includes(text(data.description)) &&
    (data.template == null || data.template === "news-list") &&
    !text(data.banner_title).trim() &&
    ["body", "page_content", "slides", "section_cards", "top_buttons", "meal_days", "meal_notes", "social_links"].every((key) => emptyValue(data[key])) &&
    ["", "Seitenübersicht"].includes(text(data.toc_title)) &&
    !data.toc_enabled &&
    !data.show_section_cards
  );
}

function verifyBackupMatchesServer(backup, snapshots) {
  for (const collection of Object.keys(snapshots)) {
    const exported = backup.content?.[collection] ?? [];
    const fromServer = snapshots[collection] ?? [];
    const a = exported.map((item) => item.slug).toSorted();
    const b = fromServer.map((item) => item.slug).toSorted();
    if (!isDeepStrictEqual(a, b)) {
      throw new Error(`--database does not match the local EmDash server for ${collection}; no migration writes were made`);
    }
  }
}

async function removeCollectionAndContent(collection) {
  const schema = collectionSchema(readAllCollectionSchemas(), collection);
  if (!schema) {
    purgeOrphanedRevisions(collection);
    return 0;
  }

  const activeItems = listItems(collection);
  for (const item of activeItems) runJson(["content", "delete", collection, item.id]);
  if (listItems(collection).length > 0) {
    throw new Error(`${collection} still has active entries; refusing to delete the collection`);
  }

  const trashedItems = await listTrashedItems(collection);
  for (const item of trashedItems) await permanentlyDeleteContent(collection, item.id);
  if ((await listTrashedItems(collection)).length > 0) {
    throw new Error(`${collection} still has trashed entries; refusing to delete the collection`);
  }

  const remainingRevisions = countContentRevisions(collection);
  if (remainingRevisions > 0) {
    throw new Error(`${collection} still has ${remainingRevisions} revisions; refusing to delete the collection`);
  }

  runCli(["schema", "delete", collection, "--url", siteUrl.origin, "--force", "--json"]);
  if (collectionSchema(readAllCollectionSchemas(), collection)) {
    throw new Error(`${collection} remains after the migration attempted to remove it`);
  }
  return trashedItems.length;
}

const initialCollections = readAllCollectionSchemas();
const initialLegacyFields = legacyFieldsFromSchema(initialCollections);
const pagesSchema = collectionSchema(initialCollections, "pages");
const projectsSchema = collectionSchema(initialCollections, "projects");
const supportersSchema = collectionSchema(initialCollections, "supporters");
const donationsSchema = collectionSchema(initialCollections, "donations");
const pageSectionsSchema = collectionSchema(initialCollections, "page_sections");
const legacyRevisionCount = countContentRevisions("projects") + countContentRevisions("page_sections");
if (!pagesSchema) throw new Error("The local EmDash server has no Pages collection");
if (schemaField(pagesSchema, "page_content") && schemaField(pagesSchema, "page_content").type !== "blocks") {
  throw new Error("Pages.page_content exists but is not a Blocks field");
}
if (initialLegacyFields.length === 0 && schemaField(pagesSchema, "body")?.type !== "portableText") {
  throw new Error("Pages has neither legacy content fields nor the standard Portable Text body");
}

if (
  initialLegacyFields.length === 0 &&
  donationsSchema?.routable === false &&
  supportersSchema?.routable === false &&
  !projectsSchema &&
  !pageSectionsSchema &&
  legacyRevisionCount === 0
) {
  const pages = listItems("pages");
  if (!pages.some((item) => item.slug === "aktuelles")) {
    console.log("The simplified content model is already migrated.");
    process.exit(0);
  }
}

for (const required of ["pages", "posts", "supporters"]) {
  if (!collectionSchema(initialCollections, required)) throw new Error(`The local EmDash server has no ${required} collection`);
}
const collectionNames = ["pages", "posts", "supporters", ...(projectsSchema ? ["projects"] : []), ...(donationsSchema ? ["donations"] : [])];
const snapshots = Object.fromEntries(collectionNames.map((collection) => [collection, listItems(collection).map((item) => getItem(collection, item.id))]));
const snapshotByCollection = Object.fromEntries(collectionNames.map((collection) => [collection, new Map(snapshots[collection].map((item) => [item.slug, item]))]));
const sources = new Map();
for (const collection of collectionNames) {
  collectImageSources(snapshots[collection], sources);
}

const tempDirectory = await mkdtemp(resolve(tmpdir(), "emdash-simplified-content-"));
const backupName = `emdash-before-simplified-content-${basename(databasePath)}-${new Date().toISOString().replace(/[:.]/g, "-")}`;
const backupPath = resolve(tmpdir(), `${backupName}.json`);
const databaseBackupPath = resolve(tmpdir(), `${backupName}.db`);

try {
  execFileSync("sqlite3", [databasePath, `.backup '${databaseBackupPath}'`], {
    cwd: root,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  const backupText = runCli(["export-seed", "--database", databasePath, "--with-content=all", "--pretty"]);
  const backup = JSON.parse(backupText);
  await writeFile(backupPath, backupText);
  verifyBackupMatchesServer(backup, snapshots);
  const oldAktuellesPage = snapshotByCollection.pages.get("aktuelles");
  if (oldAktuellesPage && !isEmptyAktuellesStub(oldAktuellesPage)) {
    throw new Error("Pages/aktuelles contains authored content or changed metadata; no migration writes were made. Move or review it before rerunning.");
  }

  const mediaByHash = new Map(
    mediaList()
      .filter((item) => item.contentHash && item.status === "ready")
      .map((item) => [item.contentHash, item]),
  );
  const mediaBySource = new Map();
  const missingSources = new Set();
  let uploadedMedia = 0;
  let reusedMedia = 0;
  for (const [source, details] of sources) {
    const local = localImagePath(source);
    if (!local) {
      throw new Error(`Image URL is not a local repository image; make it available under seed/source/images or static/images before migration: ${source}`);
    }
    let bytes;
    let file;
    for (const candidate of local.files) {
      try {
        bytes = await readFile(candidate);
        file = candidate;
        break;
      } catch (error) {
        if (error.code !== "ENOENT") throw error;
      }
    }
    if (!bytes) {
      if (details.optional) {
        missingSources.add(local.key);
        console.warn(`Legacy slider image is missing locally; migrating an empty media slot: ${source}`);
        continue;
      }
      throw new Error(`Could not find a local file for image ${source}; searched ${local.files.join(", ")}`);
    }
    const hash = contentHash(bytes);
    let item = mediaByHash.get(hash);
    if (item) {
      reusedMedia++;
    } else {
      const upload = await runJson(["media", "upload", file, ...(details.alt ? ["--alt", details.alt] : [])]);
      item = checkedMediaItem(upload);
      mediaByHash.set(hash, item);
      uploadedMedia++;
    }
    mediaBySource.set(local.key, item);
  }

  const pageUpdates = snapshots.pages.map((page) => ({
    snapshot: page,
    patch: pageUpdate(page, mediaBySource, missingSources),
  }));
  const postUpdates = snapshots.posts.map((item) => ({
    snapshot: item,
    patch: itemUpdate("posts", item, mediaBySource),
  }));
  const supporterUpdates = snapshots.supporters.map((item) => ({
    snapshot: item,
    patch: itemUpdate("supporters", item, mediaBySource),
  }));
  const allUpdates = [
    ...pageUpdates.map((item) => ({ collection: "pages", ...item })),
    ...postUpdates.map((item) => ({ collection: "posts", ...item })),
    ...supporterUpdates.map((item) => ({ collection: "supporters", ...item })),
  ];

  const schemaSeed = {
    $schema: seed.$schema,
    version: seed.version,
    defaultLocale: seed.defaultLocale,
    meta: seed.meta,
    collections: seed.collections,
    taxonomies: seed.taxonomies,
  };
  const schemaSeedPath = resolve(tempDirectory, "schema.json");
  await writeFile(schemaSeedPath, JSON.stringify(schemaSeed, null, 2));
  runCli(["seed", schemaSeedPath, "--database", databasePath, "--no-content", "--on-conflict", "update"]);

  const updatedCollections = readAllCollectionSchemas();
  const updatedPagesSchema = collectionSchema(updatedCollections, "pages");
  if (schemaField(updatedPagesSchema, "body")?.type !== "portableText") {
    throw new Error("EmDash did not apply Pages.body as Portable Text");
  }
  for (const [collection, slug] of [
    ["posts", "image"],
    ["supporters", "image"],
    ["donations", "image"],
  ]) {
    if (schemaField(collectionSchema(updatedCollections, collection), slug)?.type !== "image") {
      throw new Error(`EmDash did not add ${collection}.${slug} as an image field`);
    }
  }
  if (!collectionSchema(updatedCollections, "donations")) {
    throw new Error("EmDash did not create the Donations collection");
  }
  if (!collectionSchema(updatedCollections, "meal_plans")) {
    throw new Error("EmDash did not create the Meal plans collection");
  }

  const donationTransfers = [];
  let donationsCreated = 0;
  for (const project of snapshots.projects ?? []) {
    const donation = {
      slug: project.slug,
      locale: text(project.locale) || text(seed.defaultLocale) || "de",
      data: donationDataFromProject(project, mediaBySource),
    };
    const result = await ensureDonation(donation, resolve(tempDirectory, `donation-${safeFilename(project.id)}.json`));
    donationTransfers.push(donation);
    if (result.created) donationsCreated++;
  }

  const sourceDonationPage = snapshotByCollection.pages.get("spenden");
  const sourceMealPage = snapshotByCollection.pages.get("speiseplan");
  const donationItems = donationMenuFromPage(sourceDonationPage);
  const oldMenu =
    donationItems.length > 0
      ? (() => {
          try {
            return runJson(["menu", "get", "donation-actions"]);
          } catch (error) {
            if (/not found|404|unknown menu|menu_not_found/i.test(error.message)) return null;
            throw error;
          }
        })()
      : null;
  const menuNeedsSeed = donationItems.length > 0 && (!oldMenu || (oldMenu.items ?? []).length === 0);
  if (donationItems.length > 0 && oldMenu && (oldMenu.items ?? []).length > 0) {
    if (!isDeepStrictEqual(normalizedMenuItems(oldMenu.items), normalizedExpectedMenu(donationItems))) {
      throw new Error("Navigation → donation-actions already differs from the old Page buttons. Review the menu and backup, then rerun; no old CTA fields have been removed.");
    }
  }

  const mealPlan = mealPlanFromPage(sourceMealPage);
  let mealPlanNeedsSeed = false;
  if (mealPlan) {
    const existingPlans = listItems("meal_plans").map((item) => getItem("meal_plans", item.id));
    const existing = existingPlans.find((item) => item.slug === mealPlan.slug);
    if (existing) {
      if (!isDeepStrictEqual(normalizedMealPlan(existing.data), normalizedMealPlan(mealPlan.data))) {
        throw new Error(`Meal plan ${mealPlan.slug} already exists with different data. Review it before removing Pages.meal_days.`);
      }
    } else {
      mealPlanNeedsSeed = true;
    }
  }

  const backupSocial = isRecord(backup.settings?.social) ? backup.settings.social : {};
  const legacySocial = socialProfilesFromPage(snapshotByCollection.pages.get("kontakt"));
  const pendingSocial = Object.fromEntries(Object.entries(legacySocial).filter(([key]) => !text(backupSocial[key]).trim()));
  const expectedSocial = { ...backupSocial, ...pendingSocial };

  const featureSeed = {
    $schema: seed.$schema,
    version: seed.version,
    defaultLocale: seed.defaultLocale,
    ...(Object.keys(pendingSocial).length ? { settings: { social: pendingSocial } } : {}),
    ...(menuNeedsSeed
      ? {
          menus: [
            {
              name: "donation-actions",
              label: "Donation actions",
              locale: "de",
              items: donationItems,
            },
          ],
        }
      : {}),
    ...(mealPlanNeedsSeed ? { content: { meal_plans: [mealPlan] } } : {}),
  };
  if (Object.keys(featureSeed).some((key) => !["$schema", "version", "defaultLocale"].includes(key))) {
    const featureSeedPath = resolve(tempDirectory, "features.json");
    await writeFile(featureSeedPath, JSON.stringify(featureSeed, null, 2));
    runCli(["seed", featureSeedPath, "--database", databasePath, "--on-conflict", "update"]);
  }

  const expectedRevisions = new Map();
  const migratedCounts = { pages: 0, posts: 0, supporters: 0 };
  for (const update of allUpdates) {
    const file = resolve(tempDirectory, `${update.collection}-${safeFilename(update.snapshot.id)}.json`);
    const latest = await updateEntry(update.collection, update.snapshot, update.patch, file);
    expectedRevisions.set(`${update.collection}:${update.snapshot.id}`, latest._rev);
    if (!patchMatches(update.snapshot.data, update.patch)) migratedCounts[update.collection]++;
  }

  for (const update of allUpdates) {
    const latest = getItem(update.collection, update.snapshot.id);
    if (latest._rev !== expectedRevisions.get(`${update.collection}:${update.snapshot.id}`)) {
      throw new Error(`${update.collection}/${latest.slug} changed during migration. Review it before removing legacy fields`);
    }
    if (!patchMatches(latest.data, update.patch)) {
      throw new Error(`Read-back verification failed for ${update.collection}/${latest.slug}`);
    }
    for (const [collection, field] of initialLegacyFields) {
      if (collection !== update.collection || !Object.hasOwn(update.snapshot.data, field)) continue;
      if (!isDeepStrictEqual(latest.data[field], update.snapshot.data[field])) {
        throw new Error(`${collection}/${latest.slug}.${field} changed during migration. Review it before continuing`);
      }
    }
  }

  for (const donation of donationTransfers) {
    const latest = listItems("donations").find((item) => item.slug === donation.slug);
    if (!latest) {
      throw new Error(`Donations/${donation.slug} failed final read-back verification`);
    }
    const latestDonation = getItem("donations", latest.id);
    if (latestDonation.locale !== donation.locale || !isDeepStrictEqual(normalizedDonation(latestDonation.data), normalizedDonation(donation.data))) {
      throw new Error(`Donations/${donation.slug} failed final read-back verification`);
    }
  }
  for (const project of snapshots.projects ?? []) {
    if (getItem("projects", project.id)._rev !== project._rev) {
      throw new Error(`Projects/${project.slug} changed during migration. Review it before deleting Projects`);
    }
  }

  if (menuNeedsSeed || (oldMenu && donationItems.length > 0)) {
    const latestMenu = runJson(["menu", "get", "donation-actions"]);
    if (!isDeepStrictEqual(normalizedMenuItems(latestMenu.items), normalizedExpectedMenu(donationItems))) {
      throw new Error("Navigation → donation-actions changed during migration. Review it before removing Pages.top_buttons");
    }
  }
  if (mealPlan) {
    const plans = listItems("meal_plans").map((item) => getItem("meal_plans", item.id));
    const latestPlan = plans.find((item) => item.slug === mealPlan.slug);
    if (!latestPlan || !isDeepStrictEqual(normalizedMealPlan(latestPlan.data), normalizedMealPlan(mealPlan.data))) {
      throw new Error(`Meal plan ${mealPlan.slug} failed read-back verification`);
    }
  }

  const postMigrationExport = JSON.parse(runCli(["export-seed", "--database", databasePath, "--pretty"]));
  const persistedSocial = isRecord(postMigrationExport.settings?.social) ? postMigrationExport.settings.social : {};
  for (const [key, value] of Object.entries(expectedSocial)) {
    if (text(persistedSocial[key]) !== text(value)) {
      throw new Error(`Site Settings.social.${key} failed read-back verification`);
    }
  }

  const latestCollections = readAllCollectionSchemas();
  for (const [collection, field] of initialLegacyFields.filter(([collection, field]) => !(collection === "pages" && field === "page_content"))) {
    const latestSchema = collectionSchema(latestCollections, collection);
    if (!schemaField(latestSchema, field)) continue;
    runCli(["schema", "remove-field", collection, field, "--url", siteUrl.origin, "--json"]);
  }
  const pageContentStillExists = schemaField(collectionSchema(readAllCollectionSchemas(), "pages"), "page_content");
  if (pageContentStillExists) {
    runCli(["schema", "remove-field", "pages", "page_content", "--url", siteUrl.origin, "--json"]);
  }

  let removedAktuellesStub = false;
  if (oldAktuellesPage) {
    const current = getItem("pages", oldAktuellesPage.id);
    if (!isEmptyAktuellesStub(current)) {
      throw new Error("Pages/aktuelles changed during migration; it was not removed");
    }
    runJson(["content", "delete", "pages", current.id]);
    if (listItems("pages").some((item) => item.slug === "aktuelles")) {
      throw new Error("Pages/aktuelles remains after the migration attempted to archive the empty news-list stub");
    }
    removedAktuellesStub = true;
  }

  const archivedProjectsRemoved = await removeCollectionAndContent("projects");
  const pageSectionsRemoved = await removeCollectionAndContent("page_sections");

  const finalCollections = readAllCollectionSchemas();
  const finalLegacyFields = legacyFieldsFromSchema(finalCollections);
  if (finalLegacyFields.length > 0) {
    throw new Error(`Legacy fields remain after migration: ${finalLegacyFields.map(([collection, field]) => `${collection}.${field}`).join(", ")}`);
  }
  if (schemaField(collectionSchema(finalCollections, "pages"), "body")?.type !== "portableText") {
    throw new Error("Final Pages schema verification failed");
  }
  const finalDonationSchema = collectionSchema(finalCollections, "donations");
  for (const [slug, type] of [
    ["title", "string"],
    ["sort_order", "integer"],
    ["image", "image"],
    ["content", "portableText"],
    ["highlight", "boolean"],
    ["url", "url"],
  ]) {
    if (schemaField(finalDonationSchema, slug)?.type !== type) {
      throw new Error(`Final Donations.${slug} schema verification failed`);
    }
  }
  const finalSupportersSchema = collectionSchema(finalCollections, "supporters");
  if (finalSupportersSchema?.routable !== false) {
    throw new Error("The Supporters collection should remain non-routable");
  }
  if (finalDonationSchema.routable !== false) {
    throw new Error("The Donations collection should remain non-routable");
  }
  if (collectionSchema(finalCollections, "projects")) {
    throw new Error("The legacy Projects collection remains after migration");
  }
  if (collectionSchema(finalCollections, "page_sections")) {
    throw new Error("The legacy page_sections collection remains after migration");
  }
  const finalPages = listItems("pages");
  if (finalPages.some((page) => page.slug === "aktuelles")) {
    throw new Error("The legacy Pages/aktuelles entry remains; the archive route should be backed by News");
  }

  console.log(
    JSON.stringify(
      {
        pages: finalPages.length,
        posts: snapshots.posts.length,
        supporters: snapshots.supporters.length,
        donations: listItems("donations").length,
        donationsCreated,
        ignoredDrafts: [...ignoredDrafts],
        archivedProjectsRemoved,
        pageSectionsRemoved,
        removedAktuellesStub,
        updated: migratedCounts,
        media: { uploaded: uploadedMedia, reused: reusedMedia, referenced: sources.size },
        mealPlan: mealPlan?.slug ?? null,
        donationActions: donationItems.length,
        backup: backupPath,
        databaseBackup: databaseBackupPath,
      },
      null,
      2,
    ),
  );
} finally {
  await rm(tempDirectory, { recursive: true, force: true });
}
