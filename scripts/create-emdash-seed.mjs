import { existsSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import { basename, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";
import { markdownToPortableText } from "emdash/client";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const sourceRoot = join(root, "seed/source/content/de");
const slugify = (value) =>
  String(value ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
const asString = (value) => (value == null ? "" : String(value));
const asDate = (value) => (value instanceof Date ? value.toISOString() : value == null ? "" : String(value));
const MEDIA_SOURCE_BASE = (process.env.SEED_MEDIA_BASE_URL ?? "https://raw.githubusercontent.com/behboud/monte-web/main/seed/source").replace(/\/+$/, "");
const decodePathPart = (value) => {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};
const resolveImage = (value, alt) => {
  if (!value) return null;
  const source = String(value).replaceAll("%20", " ");
  let localPath = null;
  let relativeImagePath = "";
  let url = "";

  if (/^https?:\/\//i.test(source)) {
    const parsed = new URL(source);
    const legacyPrefix = "/monte-web/images/";
    if (parsed.hostname === "behboud.github.io" && parsed.pathname.startsWith(legacyPrefix)) {
      relativeImagePath = decodePathPart(parsed.pathname.slice(legacyPrefix.length));
      localPath = join(root, "seed/source/images", relativeImagePath);
    } else {
      url = source;
    }
  } else {
    relativeImagePath = source.replace(/^\/?(?:images\/)?/, "");
    localPath = join(root, "seed/source/images", relativeImagePath);
  }

  if (localPath) {
    const imageRoot = resolve(root, "seed/source/images");
    const resolvedLocalPath = resolve(localPath);
    if (!resolvedLocalPath.startsWith(`${imageRoot}${sep}`) || !existsSync(resolvedLocalPath)) return null;
    const encodedPath = relativeImagePath
      .split("/")
      .map((part) => encodeURIComponent(decodePathPart(part)))
      .join("/");
    url = `${MEDIA_SOURCE_BASE}/images/${encodedPath}`;
  }

  const media = { $media: { url, filename: basename(decodePathPart(new URL(url).pathname)) } };
  if (typeof alt === "string") media.$media.alt = alt;
  return media;
};
const HARD_BREAK = "\uE000";
const normalizeMarkdown = (markdown) => {
  const source = String(markdown ?? "").replaceAll("\r\n", "\n");
  const lines = source.split("\n");
  const output = [];
  const plainLine = (line) => line.trim() !== "" && !/^\s*(?:#{1,6}\s|[-*+]\s|\d+\.\s|>\s|```|!\[)/.test(line);
  const quoteLine = (line) => /^\s*>\s?/.test(line);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (quoteLine(line) && line.replace(/^\s*>\s?/, "").trim()) {
      let paragraph = `> ${line.replace(/^\s*>\s?/, "").trim()}`;
      while (i + 1 < lines.length && quoteLine(lines[i + 1]) && lines[i + 1].replace(/^\s*>\s?/, "").trim()) {
        const hardBreak = / {2,}$/.test(lines[i]);
        const next = lines[++i].replace(/^\s*>\s?/, "").trim();
        paragraph += hardBreak ? `${HARD_BREAK}${next}` : ` ${next}`;
      }
      output.push(paragraph);
      continue;
    }
    if (!plainLine(line)) {
      output.push(line);
      continue;
    }
    let paragraph = line.trim();
    while (i + 1 < lines.length && plainLine(lines[i + 1])) {
      const hardBreak = / {2,}$/.test(lines[i]);
      const next = lines[++i].trim();
      paragraph += hardBreak ? `${HARD_BREAK}${next}` : ` ${next}`;
    }
    output.push(paragraph);
  }
  return output.join("\n");
};
const LITERAL_ASTERISK = "\uE001";
const LITERAL_UNDERSCORE = "\uE004";
const INVALID_LINK_PREFIX = "\uE002";
const INVALID_LINK_SUFFIX = "\uE003";
const autoLinkMarkdown = (markdown, literals) => {
  const linkify = (segment) =>
    segment
      .replace(/\[[^\]]+\]\([^)]*\s+[^)]*\)/g, (literal) => `${INVALID_LINK_PREFIX}${literals.push(literal) - 1}${INVALID_LINK_SUFFIX}`)
      .replace(/(!?\[[^\]]*\]\([^)]*\))|(https?:\/\/[^\s<>\"'„“”]+)|([A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})/gi, (match, markdownLink, rawUrl, email) => {
        if (markdownLink) return markdownLink;
        if (email) return `[${email}](mailto:${email})`;
        const url = rawUrl.replace(/[.,;:!?]+$/, "");
        return `[${url} ](${url})${rawUrl.slice(url.length)}`;
      });
  return String(markdown ?? "")
    .split(/(`+[^`]*`+)/g)
    .map((segment) => (segment.startsWith("`") ? segment : linkify(segment)))
    .join("");
};
const splitInlineImages = (markdown) => String(markdown ?? "").replace(/([^\n])(!\[[^\]]*\]\([^)]+\))/g, "$1\n\n$2");
const restoreText = (value, literals) =>
  String(value ?? "")
    .replaceAll(LITERAL_ASTERISK, "*")
    .replaceAll(LITERAL_UNDERSCORE, "_")
    .replace(/\uE002(\d+)\uE003/g, (token, index) => literals[Number(index)] ?? token);
const moveLinkWhitespace = (children, markDefs = []) => {
  const output = [];
  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    const next = children[i + 1];
    const after = children[i + 2];
    const isLink = child?._type === "span" && child.marks?.some((key) => markDefs.some((mark) => mark._key === key && mark._type === "link"));
    if (isLink && next?._type === "span" && next.text === " " && !next.marks?.length && after?.marks?.includes("em")) {
      output.push({ ...child, text: `${child.text} ` });
      i++;
    } else {
      output.push(child);
    }
  }
  return output;
};
const toPortableText = (text) => {
  const literals = [];
  const source = splitInlineImages(
    String(text ?? "")
      .replace(/(?<=\p{L})_(?=innen\b)/gu, LITERAL_UNDERSCORE)
      .replace(/\\\*/g, LITERAL_ASTERISK),
  );
  const blocks = markdownToPortableText(normalizeMarkdown(autoLinkMarkdown(source, literals))).flatMap((block) => {
    if (!Array.isArray(block.children)) {
      if (block._type !== "image") return [block];
      const alt = restoreText(block.alt, literals);
      const asset = block.asset && typeof block.asset === "object" ? resolveImage(block.asset.url, alt) : null;
      return asset ? [{ ...block, alt, asset }] : [];
    }
    return [{
      ...block,
      markDefs: block.markDefs?.map((mark) => (/^https?:\/\//i.test(mark.href ?? "") ? { ...mark, blank: true } : mark)),
      children: moveLinkWhitespace(
        block.children.flatMap((child, index) => {
          if (child._type !== "span") return [child];
          const restored = restoreText(child.text, literals);
          if (!restored.includes(HARD_BREAK)) {
            return restored === child.text ? [child] : [{ ...child, text: restored }];
          }
          const parts = restored.split(HARD_BREAK);
          return parts.flatMap((part, partIndex) => {
            const result = [];
            if (part) result.push({ ...child, _key: `${child._key}-${partIndex}`, text: part });
            if (partIndex < parts.length - 1) {
              result.push({ _type: "span", _key: `${child._key}-break-${index}-${partIndex}`, text: "\n", marks: [] });
            }
            return result;
          });
        }),
        block.markDefs,
      ),
    }];
  });
  const result = [];
  for (const block of blocks) {
    const previous = result.at(-1);
    if (block._type === "image" && previous?._type === "block" && previous.style === "blockquote") {
      previous.children.push(block);
    } else {
      result.push(block);
    }
  }
  return result;
};
const toSummary = (markdown) => {
  const source = String(markdown ?? "")
    .replaceAll("\r\n", "\n")
    .trim();
  const firstLine = source.split("\n").find((line) => line.trim()) ?? "";
  const summarySource = /^\s*#{1,6}\s/.test(firstLine) ? source : (source.split(/\n\s*\n/, 1)[0] ?? "");
  return summarySource
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/^\s*#{1,6}\s+/gm, "")
    .replace(/^\s*(?:[-*+]\s+|\d+\.\s+|>\s?)/gm, "")
    .replace(/[*_~`]/g, "")
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim();
};
const getMarkdownFiles = async (directory) => {
  const { readdir } = await import("node:fs/promises");
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await getMarkdownFiles(path)));
    else if (entry.isFile() && path.endsWith(".md")) files.push(path);
  }
  return files.sort();
};
const parsed = new Map();
for (const path of await getMarkdownFiles(sourceRoot)) {
  parsed.set(relative(sourceRoot, path).split(sep).join("/"), matter(await readFile(path, "utf8")));
}
const pageFiles = ["_index.md", "elternengagement/_index.md", "foerderer/_index.md", "schule/_index.md", "speiseplan/_index.md", "spenden/_index.md", "verein/_index.md", "pages/datenschutz.md", "pages/impressum.md", "pages/karriere.md", "pages/kontakt.md", "pages/presse.md"];
const pages = [];
let sectionCount = 0;
const supporters = [];
const donations = [];
const posts = [];
const mealPlans = [];
const donationActions = [];
const cardsSubFields = [
  { slug: "title", label: "Title", type: "string" },
  { slug: "description", label: "Description", type: "text" },
  { slug: "image", label: "Image", type: "image" },
  { slug: "href", label: "Link", type: "url" },
];
const slidesSubFields = [{ slug: "image", label: "Image", type: "image" }];
const menuDaysSubFields = [
  { slug: "date", label: "Date", type: "datetime" },
  { slug: "main", label: "Main course", type: "text" },
  { slug: "side", label: "Side dish", type: "text" },
  { slug: "dessert", label: "Dessert", type: "text" },
  { slug: "drink", label: "Drink", type: "text" },
];
const field = (slug, label, type, options = {}) => ({ slug, label, type, ...options });
const repeater = (slug, label, subFields) => field(slug, label, "repeater", { validation: { subFields } });
const pageFields = [
  field("title", "Title", "string", { required: true, searchable: true }),
  field("description", "Description", "text"),
  field("banner_title", "Banner title", "string"),
  field("body", "Page content", "portableText", { searchable: true }),
  repeater("slides", "Slider images", slidesSubFields),
  repeater("section_cards", "Section cards", cardsSubFields),
];
const mealPlanFields = [field("title", "Plan title", "string", { required: true, searchable: true }), field("week_start", "Week starts", "datetime", { required: true, indexed: true }), repeater("days", "Meals", menuDaysSubFields), repeater("notes", "Notes", [{ slug: "note", label: "Note", type: "text" }])];
const resolvePageSlug = (path) => {
  if (path === "_index.md") return "home";
  if (path.endsWith("/_index.md")) return path.slice(0, -"/_index.md".length);
  return basename(path, ".md");
};
const escapeAttribute = (value) => String(value).replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
const makeHeading = (title, level, key) => ({
  _type: "block",
  _key: key,
  style: `h${Math.max(1, Math.min(level, 6))}`,
  markDefs: [],
  children: [{ _type: "span", _key: `${key}:span`, text: title, marks: [] }],
});
const flattenSections = (pageSlug, entries, level = 2, state = { index: 0, anchors: new Map() }) => {
  const blocks = [];
  for (const entry of entries ?? []) {
    const title = asString(entry.title || entry.label).trim();
    if (!title) throw new Error(`A section on "${pageSlug}" has no heading`);
    const rawAnchor = asString(entry.id || slugify(title));
    const anchorId = /^[A-Za-z][A-Za-z0-9_-]*$/.test(rawAnchor) ? rawAnchor : slugify(rawAnchor);
    const index = state.index++;
    const headingKey = `page:${pageSlug}:section:${slugify(anchorId) || index}:${index}`;
    const image = resolveImage(entry.image, title);
    if (image) blocks.push({ _type: "image", _key: `${headingKey}:image`, asset: image, alt: title, alignment: "full" });
    blocks.push(makeHeading(title, level, headingKey));
    state.anchors.set(headingKey, anchorId);
    blocks.push(...toPortableText(asString(entry.content)));
    blocks.push(...flattenSections(pageSlug, entry.children, level + 1, state));
  }
  return blocks;
};
const insertAnchorAliases = (blocks, anchors) => {
  const occurrences = new Map();
  const result = [];
  for (const block of blocks) {
    if (block._type === "block" && /^h[1-6]$/.test(block.style ?? "")) {
      const title = (block.children ?? []).map((child) => child.text ?? "").join("");
      const base = slugify(title) || "section";
      const occurrence = (occurrences.get(base) ?? 0) + 1;
      occurrences.set(base, occurrence);
      const generatedId = occurrence === 1 ? base : `${base}-${occurrence}`;
      const legacyId = anchors.get(block._key);
      if (legacyId && legacyId !== generatedId) {
        result.push({
          _type: "htmlBlock",
          _key: `${block._key}:anchor`,
          html: `<span id="${escapeAttribute(legacyId)}" class="page-anchor"></span>`,
        });
      }
    }
    result.push(block);
  }
  return result;
};
const pageItems = pageFiles.map((path) => {
  const parsedFile = parsed.get(path);
  if (!parsedFile) throw new Error(`Missing seed source page ${path}`);
  const frontmatter = parsedFile.data;
  const pageSlug = resolvePageSlug(path);
  const toc = frontmatter.toc ?? {};
  const topLevelSections = toc.sections ?? (Array.isArray(toc) ? toc : []);
  const hasSectionContent = (entries) => entries.some((entry) => entry.content || entry.image || (entry.children?.length ?? 0) > 0);
  const sectionState = { index: 0, anchors: new Map() };
  const sections = hasSectionContent(topLevelSections) ? flattenSections(pageSlug, topLevelSections, 2, sectionState) : [];
  sectionCount += [...sectionState.anchors.keys()].length;
  const body = insertAnchorAliases([...toPortableText(parsedFile.content), ...sections], sectionState.anchors);
  const mealPlan = frontmatter.meal_plan ?? {};
  const mealDays = (mealPlan.days ?? []).map((day) => ({
    date: asDate(day.date),
    main: asString(day.main),
    side: asString(day.side),
    dessert: asString(day.dessert),
    drink: asString(day.drink),
  }));
  const mealNotes = (mealPlan.notes ?? []).map((note) => ({ note: asString(note) }));
  const data = {
    title: asString(frontmatter.banner?.title ?? frontmatter.title ?? "Willkommen"),
    description: asString(frontmatter.description),
    banner_title: asString(frontmatter.banner?.title ?? frontmatter.uberschrift),
    body,
    slides: (frontmatter.slider?.images ?? []).flatMap((source) => {
      const image = resolveImage(source, "");
      return image ? [{ image }] : [];
    }),
    section_cards: (frontmatter.section_cards?.items ?? []).map((card) => {
      const title = asString(card.title || card.label);
      const image = resolveImage(card.image, title);
      return {
        title,
        description: asString(card.description),
        ...(image ? { image } : {}),
        href: asString(card.href),
      };
    }),
  };
  if (pageSlug === "spenden") {
    donationActions.push(
      ...(frontmatter.top_buttons ?? []).map((button) => ({
        label: asString(button.label),
        url: asString(button.url),
        classes: button.style === "primary" ? "spenden-cta-primary" : "spenden-cta-secondary",
      })),
    );
    for (const supporter of frontmatter.spenden ?? []) {
      const slug = slugify(supporter.title);
      const image = resolveImage(supporter.image, asString(supporter.title));
      supporters.push({
        id: slug,
        slug,
        status: "published",
        data: {
          title: asString(supporter.title),
          sort_order: supporters.length,
          ...(image ? { image } : {}),
          content: toPortableText(supporter.content),
        },
      });
    }
  }
  if (pageSlug === "foerderer") {
    for (const opportunity of frontmatter.projekte ?? []) {
      const slug = slugify(opportunity.title);
      const image = resolveImage(opportunity.image, asString(opportunity.title));
      donations.push({
        id: slug,
        slug,
        status: "published",
        data: {
          title: asString(opportunity.title),
          sort_order: donations.length,
          ...(image ? { image } : {}),
          content: toPortableText(opportunity.content),
          highlight: Boolean(opportunity.highlight),
          url: asString(opportunity.url),
        },
      });
    }
  }
  if (pageSlug === "speiseplan" && mealDays.length > 0) {
    const weekStart = mealDays
      .map((day) => day.date)
      .filter(Boolean)
      .sort()[0];
    const slugDate = weekStart.slice(0, 10);
    const formattedWeekStart = new Intl.DateTimeFormat("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      timeZone: "Europe/Berlin",
    }).format(new Date(weekStart));
    mealPlans.push({
      id: `week-of-${slugDate}`,
      slug: `week-of-${slugDate}`,
      status: "published",
      data: {
        title: `Speiseplan ab ${formattedWeekStart}`,
        week_start: weekStart,
        days: mealDays,
        notes: mealNotes,
      },
    });
  }
  const page = { id: pageSlug, slug: pageSlug, status: "published", data };
  pages.push(page);
  return page;
});
for (const path of [...parsed.keys()].filter((file) => file.startsWith("aktuelles/") && !file.endsWith("_index.md"))) {
  const parsedFile = parsed.get(path);
  const frontmatter = parsedFile.data;
  const slug = basename(path, ".md");
  const summary = toSummary(parsedFile.content);
  const tags = (frontmatter.tags ?? []).map(slugify);
  const title = asString(frontmatter.title || slug);
  const featuredImage = resolveImage(frontmatter.image, title);
  posts.push({
    id: slug,
    slug,
    status: frontmatter.draft ? "draft" : "published",
    data: {
      title,
      description: asString(frontmatter.description),
      event_date: asDate(frontmatter.date ?? frontmatter.publishdate),
      summary,
      ...(featuredImage ? { image: featuredImage } : {}),
      author_name: asString(frontmatter.author),
      body: toPortableText(parsedFile.content),
    },
    taxonomies: { tag: tags },
  });
}
const tagLabels = new Map();
for (const parsedFile of parsed.values()) {
  for (const tag of parsedFile.data.tags ?? []) tagLabels.set(slugify(tag), String(tag));
}
const topMenu = [
  { label: "Aktuelles", url: "/", classes: "" },
  { label: "Schule", url: "/schule/", classes: "" },
  { label: "Elternarbeit", url: "/elternengagement/", classes: "" },
  { label: "Spenden", url: "/spenden/", classes: "" },
  { label: "Verein", url: "/verein/", classes: "" },
  { label: "Speiseplan", url: "/speiseplan/", classes: "fa fa-utensils" },
  { label: "Eltern-Login", url: "https://www.montessorischule-gilching.de/login", classes: "fa fa-user-lock", target: "_self" },
];
const primaryMenu = [
  { label: "Startseite", url: "/" },
  { label: "Schule", url: "/schule/" },
  { label: "Elternengagement", url: "/elternengagement/" },
  { label: "Spenden", url: "/spenden/" },
  { label: "Verein", url: "/verein/" },
  { label: "Karriere", url: "/karriere/" },
  { label: "Presse", url: "/presse/" },
];
const footerMenu = [
  { label: "Impressum", url: "/impressum/" },
  { label: "Datenschutzerklärung", url: "/datenschutz/" },
  { label: "Kontakt", url: "/kontakt/" },
  { label: "Presse", url: "/presse/" },
  { label: "Login", url: "https://www.montessorischule-gilching.de/login", target: "_self" },
];
const menu = (name, label, items) => ({
  name,
  label,
  locale: "de",
  items: items.map((item) => ({
    type: "custom",
    label: item.label,
    url: item.url,
    ...(item.target ? { target: item.target } : {}),
    ...(item.classes ? { cssClasses: item.classes } : {}),
  })),
});
const socialProfiles = {};
for (const link of parsed.get("pages/kontakt.md")?.data.social_links ?? []) {
  const key = asString(link.name).trim().toLowerCase();
  const value = asString(link.link).trim();
  if (["twitter", "github", "facebook", "instagram", "linkedin", "youtube"].includes(key) && value) {
    socialProfiles[key] = value;
  }
}
const seed = {
  $schema: "https://emdashcms.com/seed.schema.json",
  version: "1",
  defaultLocale: "de",
  meta: {
    name: "Montessori Schule Gilching",
    description: "Montessori Schule Gilching (Münchner Westen)",
    author: "Montessori Schule Gilching",
  },
  settings: {
    title: "Montessori Schule Gilching (München West)",
    tagline: "Montessori Schule Gilching (München Westen)",
    timezone: "Europe/Berlin",
    ...(Object.keys(socialProfiles).length ? { social: socialProfiles } : {}),
  },
  collections: [
    {
      slug: "pages",
      label: "Pages",
      labelSingular: "Page",
      description: "Pages with one full Portable Text body and optional page-owned slides and section cards.",
      supports: ["drafts", "revisions", "search", "seo"],
      urlPattern: "/{slug}",
      fields: pageFields,
    },
    {
      slug: "posts",
      label: "News",
      labelSingular: "News article",
      description: "Articles shown on the home page and in the news archive.",
      supports: ["drafts", "revisions", "preview", "scheduling", "search", "seo"],
      urlPattern: "/aktuelles/{slug}",
      dateField: "event_date",
      fields: [field("title", "Title", "string", { required: true, searchable: true }), field("description", "Meta description", "text"), field("event_date", "Event date", "datetime", { required: true }), field("summary", "Summary", "text"), field("image", "Featured image", "image"), field("author_name", "Author", "string"), field("body", "Article content", "portableText", { searchable: true })],
    },
    {
      slug: "supporters",
      label: "Supporters",
      labelSingular: "Supporter",
      description: "People and organizations acknowledged on the donation page.",
      supports: ["drafts", "revisions", "search"],
      routable: false,
      fields: [field("title", "Name", "string", { required: true, searchable: true }), field("sort_order", "Display order", "integer", { required: true }), field("image", "Image", "image"), field("content", "Description", "portableText")],
    },
    {
      slug: "donations",
      label: "Donations",
      labelSingular: "Donation",
      description: "Fundraising opportunities shown to supporters and in the donation highlight.",
      supports: ["drafts", "revisions", "search"],
      routable: false,
      fields: [field("title", "Title", "string", { required: true, searchable: true }), field("sort_order", "Display order", "integer", { required: true }), field("image", "Image", "image"), field("content", "Description", "portableText", { searchable: true }), field("highlight", "Show in the donation highlight", "boolean"), field("url", "Promotion URL", "url")],
    },
    {
      slug: "meal_plans",
      label: "Meal plans",
      labelSingular: "Meal plan",
      description: "Weekly menus managed as independent content entries.",
      supports: ["drafts", "revisions", "search"],
      dateField: "week_start",
      routable: false,
      fields: mealPlanFields,
    },
  ],
  taxonomies: [
    {
      name: "tag",
      label: "Tags",
      labelSingular: "Tag",
      hierarchical: false,
      collections: ["posts"],
      locale: "de",
      terms: [...tagLabels.entries()].map(([slug, label]) => ({ slug, label, locale: "de" })),
    },
  ],
  menus: [menu("top", "Top navigation", topMenu), menu("main", "Main navigation", primaryMenu), menu("footer", "Footer navigation", footerMenu), menu("donation-actions", "Donation actions", donationActions)],
  content: {
    pages: pageItems,
    posts,
    supporters,
    donations,
    meal_plans: mealPlans,
  },
};
for (const collection of seed.collections) {
  collection.fields = collection.fields.filter((field) => field !== undefined);
  for (const field of collection.fields) {
    if (field.options === undefined) delete field.options;
  }
  if (collection.dateField === undefined) delete collection.dateField;
}
await writeFile(join(root, "seed/seed.json"), `${JSON.stringify(seed, null, 2)}\n`);
console.log(JSON.stringify({ pages: pages.length, sections: sectionCount, posts: posts.length, supporters: supporters.length, donations: donations.length, tags: tagLabels.size }, null, 2));
