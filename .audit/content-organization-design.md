# Page content organization

## Status update — 2026-10-12

This custom-block design was superseded by standard Pages Portable Text and then by `.audit/simplified-content-model-design.md`. With owner approval, the unused `page_sections` collection and its records were removed after a raw SQLite backup.

## Problem

Editors currently see a `Pages` collection and a separate `Page sections` collection. Each section stores a `page_slug`, and the site code fetches all sections before filtering by that string. The editor must leave a page, find the matching section records, and keep their order and page slug straight. Several section records belong to standard pages and are not rendered at all.

## Usage

An editor opens **Pages**, selects a page, and edits one **Page content** field. The editor adds a **Rich text** block for ordinary text or a **Section** block for a titled page area. Each section's heading, table-of-contents label, heading level, optional anchor and image, and rich text stay on that page. EmDash reorders and edits the blocks in place.

The public route reads the page's ordered blocks. Rich-text blocks render through Portable Text. Section blocks render their heading and content and supply the table of contents.

## Shape

`PageContentBlock` is the EmDash `blocks` field union for `page_text` and `page_section`.

```ts
type PageContentBlock = PageTextBlock | PageSectionBlock;

interface PageTextBlock {
  _type: "page_text";
  _version: 1;
  _key: string;
  content: PortableTextBlock[];
}

interface PageSectionBlock {
  _type: "page_section";
  _version: 1;
  _key: string;
  title: string;
  navigation_label: string;
  heading_level: "Section" | "Subsection" | "Detail";
  anchor_id: string;
  image_url: string;
  content: PortableTextBlock[];
}
```

The page parser validates EmDash data into this union. `getPageSections(content)` derives the typed section tree for navigation. `PageContent.astro` uses EmDash's `Blocks` renderer. It does not query a second collection or rebuild a page from detached records.

A local migration script applies only the Pages and legacy section schema, reads the current page and section entries, writes equivalent blocks with stable keys, verifies the copy, and removes the old `body` field. It leaves old `page_sections` records in the database and hides their collection from the admin sidebar. This keeps the original section records available if the migration needs review.

## Synthesis decision

The chosen shape is a single page-owned EmDash `blocks` field. This Pi session has no subagent tool, so I compared the candidates directly instead of running the arena's parallel cross-judge. The `blocks` field exposes one editor control and keeps the section data with its page. The EmDash Blocks editor provides typed fields, Portable Text, ordering, duplication, and deletion without a custom admin plugin.

## Tradeoffs accepted

- Editors use a block picker for page text instead of opening one rich-text field. In exchange, all page content has one owner and section metadata stays attached to its content.
- The same page content field appears on every page template because EmDash has no conditional field visibility in its schema. In exchange, pages remain in one collection.
- The old `page_sections` collection remains in the database but is hidden. In exchange, no legacy section records are deleted during this change.

## Alternatives considered

- **One Portable Text field with headings.** This would give editors one familiar text editor, but the field has no supported place for the separate navigation label, stable anchor, image, and section level. Keeping those values elsewhere would recreate a second content shape.
- **Keep `page_sections` as entries with a page reference.** A reference picker would make the relationship clearer, but editors would still manage page content outside the page entry.
- **Use a repeater field.** The installed EmDash repeater editor does not provide a Portable Text subfield editor. It cannot hold the existing rich section content safely.

## Open risks

The old collection contains section records for standard pages that the current renderer ignores. They stay hidden and are not copied into those pages. Removing those records later needs a separate review because it would delete stored content.

## Implementation result

`seed/seed.json` now defines `page_content` as a blocks field with `page_text` and `page_section` variants. The runtime parser derives navigation from those blocks, and the section route renders the complete ordered field, including headings with no body content.

`scripts/migrate-page-content.mjs` applies the new schema, copies body text and section records with stable keys, verifies each copy and revision, then removes the legacy `body` field. It is idempotent and leaves the old `page_sections` entries hidden for review. The local `data.db` was migrated, with its pre-migration export kept outside the repository in the system temporary directory.

The old-shape migration and mixed text-plus-section case both passed against disposable databases. A rerun reported the database was already migrated. `npm run build` passed with zero errors, and the full desktop and mobile Playwright screenshot suite passed with zero pixel differences.
