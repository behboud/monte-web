import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));

test("seed generator produces the simplified EmDash content model", async () => {
  const generated = spawnSync(process.execPath, ["scripts/create-emdash-seed.mjs"], {
    cwd: root,
    encoding: "utf8",
  });
  assert.equal(generated.status, 0, generated.stderr || generated.stdout);

  const seed = JSON.parse(await readFile(resolve(root, "seed/seed.json"), "utf8"));
  const pagesSchema = seed.collections.find((collection) => collection.slug === "pages");
  const donationSchema = seed.collections.find((collection) => collection.slug === "donations");
  const supportersSchema = seed.collections.find((collection) => collection.slug === "supporters");
  const mealPlanSchema = seed.collections.find((collection) => collection.slug === "meal_plans");
  const pageFields = pagesSchema.fields.map((field) => field.slug);
  const pageSlugs = seed.content.pages.map((page) => page.slug);
  const schoolPage = seed.content.pages.find((page) => page.slug === "schule");
  const anchorAliases = seed.content.pages.flatMap((page) =>
    (page.data.body ?? []).filter((block) => block._type === "htmlBlock" && /<span\s+id=/.test(block.html ?? "")),
  );
  const sectionCards = pagesSchema.fields.find((field) => field.slug === "section_cards");
  const cardLink = sectionCards.validation.subFields.find((field) => field.slug === "href");

  assert.deepEqual(pageFields, ["title", "description", "banner_title", "body", "slides", "section_cards"]);
  assert.equal(pagesSchema.label, "Seiten");
  assert.equal(sectionCards.label, "Abschnittskarten (optional)");
  assert.equal(cardLink.label, "Sprunglink (optional; leer = gleichnamige Überschrift)");
  assert.equal(sectionCards.required, undefined);
  assert.equal(seed.content.pages.filter((page) => page.slug === "home").length, 1);
  assert.equal(pageSlugs.includes("aktuelles"), false);
  assert.equal(pageSlugs.includes("karriere"), false);
  assert.equal(seed.menus.some((menu) => menu.name === "main"), false);
  assert.equal(seed.taxonomies.some((taxonomy) => taxonomy.name === "category"), false);
  assert.equal(seed.content.pages.every((page) => !Object.hasOwn(page.data, "template")), true);
  assert.deepEqual(anchorAliases, []);
  assert.deepEqual(schoolPage.data.section_cards.map((card) => card.href), [
    "#schulalltag",
    "#wer-wir-sind",
    "#komm-zu-uns",
  ]);
  assert.deepEqual(donationSchema.fields.map((field) => field.slug), [
    "title",
    "sort_order",
    "image",
    "content",
    "highlight",
    "url",
  ]);
  assert.equal(donationSchema.routable, false);
  assert.equal(supportersSchema.routable, false);
  assert.equal(mealPlanSchema.routable, false);
  assert.equal(seed.collections.some((collection) => collection.slug === "projects"), false);
  assert.equal(seed.collections.some((collection) => collection.slug === "page_sections"), false);
  assert.equal(seed.content.donations.length, 3);
  assert.equal(seed.content.supporters.length, 12);
  assert.equal(seed.content.posts.length, 5);
  assert.equal(seed.menus.find((menu) => menu.name === "donation-actions").items.length, 2);
});
