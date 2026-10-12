# Standard EmDash page model

## Status update — 2026-10-12

This earlier design is superseded by `.audit/simplified-content-model-design.md`. After owner approval, Projects was copied into Donations and both the duplicate Projects collection and unused `page_sections` archive were removed after a raw SQLite backup. The migration's current behavior and results are recorded in the newer audit.

## Problem

The current `Pages` editor has a custom `page_content` Blocks field, a table-of-contents configuration, and fields for calls to action, meals, and social links. Those fields apply to only a few templates, but EmDash does not provide conditional field visibility in its collection schema. As a result, every Pages entry carries template-specific controls. The custom block field also makes ordinary page copy less like a standard EmDash page than it needs to be.

The site must keep its existing routes and appearance while editors move to one full-page rich-text editor. The local database already contains migrated and potentially editable content, so the reshape must preserve the current records rather than regenerate over them.

## Usage

- An editor opens **Pages → Unsere Schule** and writes the whole page in **Page content**, the normal EmDash Portable Text editor. Headings, links, lists, quotes, and images live in order in that field.
- Images inserted in the body use EmDash's media picker. Images in the page slider and section-card repeater use native image fields, so they are also selected from the media library.
- Section cards stay with the page as a small ordered repeater. They have no independent identity or lifecycle; the cards link to heading anchors in the body.
- Weekly menus are individual entries in a new **Meal plans** collection under Content. The meal-plan page renders the most recently published plan.
- Donation buttons are a named EmDash menu (`donation-actions`), not a field on every page. Its menu items carry their button CSS classes and can be reused from another page template if needed.
- Social profiles live in EmDash's global **Site settings → Social** fields and render in the footer.

## Grounding

- The current local `Pages` schema has `page_content`, `toc_enabled`, `toc_title`, `show_section_cards`, `top_buttons`, `meal_days`, `meal_notes`, and `social_links`. EmDash's content editor renders all collection fields; the schema offers no conditional visibility predicate.
- `RepeaterField` supports native `image` subfields. `PortableTextEditor` supports headings, images, and an HTML block; the site's HTML-block sanitizer permits `id` attributes.
- EmDash `ImageValue` is the persisted image-picker value. The media library CLI can upload local files, and Portable Text image blocks use media references rather than a page-specific image URL.
- EmDash site settings have standard `twitter`, `github`, `facebook`, `instagram`, `linkedin`, and `youtube` values. EmDash menus support ordered items with `cssClasses`.
- The local database currently has 13 Pages entries and 46 old `page_sections` records. The previous migration copied the live section content into page-owned data and retained the remaining legacy records. `schule` currently has 21 section blocks, 5 slider images, and 3 section cards. There is one unrelated media-library item; the repository has the local source images needed for migration.

## Candidates

### A. Standard Pages, with separate domain-owned data

Keep the `Pages` collection and template discriminator. Replace `page_content` with one `body: portableText` field. Keep only genuinely page-owned display fields (slider and section cards) on Pages, with image subfields. Put meals in a `meal_plans` collection, donation links in a named EmDash menu, and social profiles in Site settings.

This gives editors the standard page editor without scattering normal pages across collections. Only independent content lifecycles get their own EmDash concepts.

### B. Put every page feature in Portable Text

Use a Portable Text body with custom blocks for section cards, weekly menus, donation buttons, and social links.

This removes fields from the Pages form, but ordinary content would depend on site-specific block types and editor/rendering extensions. Meals would be embedded in an unrelated page body, and global social profiles would be duplicated or hard to reuse. This is not the standard editor the user asked for.

### C. One collection per page template

Create separate collections for school, standard, meal-plan, donations, and supporter pages, each exposing only relevant fields.

This makes each form narrow, but splits the Pages list, duplicates title/description/body schema, and requires route-specific lookup and migration code. It is a larger taxonomy change than the content needs.

## Synthesis decision

Choose **A**. It uses native EmDash field types at each boundary: Portable Text for page copy, repeaters for ordered page-owned cards/slides, an image field for every editable image, a content collection for dated meal plans, a menu for navigational calls to action, and Site settings for global profiles. This removes the table of contents instead of maintaining a second representation of headings.

Section cards are a repeater, not another collection or custom Portable Text block: they are a small ordered presentation component owned by one page, with no independent route or lifecycle. The meal plan is a collection because each week is a separately managed, date-ordered content item. Donation links are menus because they are ordered navigation actions with label, URL, and CSS class; this avoids a custom CTA collection and keeps them out of every Page form.

The public renderer assigns deterministic IDs to h1–h6 headings from their text. The existing section-card fragments continue to work; when an old hand-authored ID differs from the heading slug, migration adds a small sanitized HTML anchor block as an alias. Editors can add their own custom anchor in the standard editor's HTML block. No table of contents is rendered or stored.

### Candidate comparison

| Criterion | A: standard Pages + owned data | B: all rich-text blocks | C: collection per template |
| --- | --- | --- | --- |
| One familiar editor for a full page | Strong | Medium | Strong |
| Native media picker and reusable images | Strong | Strong | Strong |
| No irrelevant meal/social/CTA controls on Pages | Strong | Strong | Strong |
| Simple route and content lookup | Strong | Medium | Weak |
| Fits EmDash's standard concepts | Strong | Weak | Medium |
| Preserves current edits with a bounded migration | Strong | Medium | Weak |

Candidates were compared serially in this Pi session because no subagent tool is available here. There was no independent-model cross-judge; the choice is grounded in the installed EmDash source and current local data.

## Shape

```ts
import type { ImageValue } from "emdash";
import type { PortableTextBlock } from "emdash/client";

interface PageData {
  title: string;
  description: string;
  template: PageTemplate;
  banner_title: string;
  body: PortableTextBlock[];
  slides: Array<{ image: ImageValue | null }>;
  section_cards: Array<{
    title: string;
    description: string;
    image: ImageValue | null;
    href: string;
  }>;
}

interface MealPlanData {
  title: string;
  week_start: string;
  days: MealDay[];
  notes: string[];
}

// EmDash Menu: name "donation-actions"; items contain label, URL,
// and cssClasses such as "spenden-cta-primary".
// SiteSettings.social: global profile values.
```

`readPage()` remains the runtime validation boundary for CMS data. It validates the common page fields and media references, then templates consume `PageData`; it does not parse a table of contents or section tree. The meal-plan route queries one published `meal_plans` entry, while the donations route loads `getMenu("donation-actions")`. The footer reads `getSiteSettings().social`.

## Migration and verification

1. Export a pre-migration seed backup before any schema or content writes.
2. Upload referenced local images to EmDash Media and build a reusable source-path → `ImageValue` map.
3. Add the standard `body` and media fields, the `meal_plans` schema, the donation-actions menu, and global social settings without removing legacy fields.
4. Convert existing page-owned content blocks to Portable Text in source order; convert legacy image URLs in fields and Portable Text image blocks to Media references; move meal data, donation links, and social profiles to their new owners.
5. Read the records back and verify text, order, anchors, image references, and revision tokens. Only then remove the obsolete `page_content`, TOC, meal, social, CTA, and URL fields. Leave the archival `page_sections` records intact; the current renderer does not query them, though EmDash still includes their count on its dashboard.
6. Verify the admin form and Media picker in a real browser, run the build and strict desktop/mobile screenshot suite without changing its baseline or tolerance, and confirm the migration is idempotent on a disposable database.

Scope is a schema/seed change, one resumable data migration, the page parser and affected renderers, and focused admin/public verification. This is local-only; the existing GitHub Pages deployment remains a separate host decision because the EmDash app is server-rendered.

## Tradeoffs accepted

- Pages still has optional slider and section-card repeaters because they belong to the page and EmDash has no conditional field visibility. The unrelated meal, social, and CTA controls leave the Pages schema.
- A meal plan adds one Content collection. In exchange, weekly plans have their own dates, revisions, and editing lifecycle.
- Donation button styles are menu-item CSS classes. In exchange, CTA links use EmDash's existing menu editor rather than a custom content type.
- Heading IDs are generated from heading text; a custom ID requires a small HTML anchor block. In exchange, headings remain standard Portable Text instead of gaining a bespoke heading editor extension.
- Fresh-database seed media imports use EmDash's supported `$media` URL path against the public `raw.githubusercontent.com/behboud/monte-web/main/assets/images` source. A clean seed run succeeded. The local existing-database migration instead uploads checked-in image files through the local Media API.

## Alternatives rejected

- **Custom `page_content` Blocks union:** preserves separate section metadata, but asks editors to choose between text and section blocks instead of using one ordinary rich-text field.
- **A new collection for section cards:** duplicates page identity and makes editors switch away from the page to change a small ordered set.
- **A new CTA content collection:** would be reasonable if CTA records had independent content lifecycle, but these are ordered navigational links; EmDash menus already model them.
- **A generated table of contents:** duplicates the headings in Portable Text, can drift after edits, and is explicitly unwanted here.

## Open risks

- Fresh-database seeding requires network access to the public GitHub source archive. All available source images loaded in a clean-database seed test; four legacy slider files missing from the repository are omitted so they do not create broken media references. Local migration of an existing database uses checked-in files instead.
- Verification on a disposable migrated database confirmed that the Pages editor, Media picker, clean seed application, Astro build, and already-migrated guard work. The latest frozen visual run reports 31 passed, 22 failed, and 1 skipped; the remaining exact-pixel differences occur in rendered content/media, and the school page is 1 px taller. No snapshot or tolerance was changed. Native EmDash Media rendering remains in place; if zero-pixel parity is required, a rendering-adapter investigation is still open.
- A migration performed while Astro is running can leave its in-process Site Settings cache stale; restart the dev server afterward so migrated social links render immediately.
- Production hosting is unchanged and is not verified by this local content-model migration.
