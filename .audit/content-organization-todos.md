# Content organization

## Historical custom-block implementation (superseded)

The custom `page_content` Blocks design below was implemented and later replaced by the standard Pages Portable Text model described in `.audit/standard-page-model-design.md`.

### Architect phases
- [x] Ground
- [x] Sketch
- [x] Agree
- [x] Implement
- [ ] Scrap
  - skip: retained as migration history; it is superseded, not reused.

### Feature throughput checkpoint
- [x] Trace the page schema, section storage, render path, and current EmDash field constraints.
- [x] Keep the schema, parser, renderers, and migration changes serial so they use one content shape.

### Implementation
- [x] Move page content into a custom blocks field with rich-text and section variants.
- [x] Generate section blocks inside the parent page and hide the legacy Page sections collection.
- [x] Add an idempotent local migration and verify the old custom-block model.
- [x] Leave changes local. Do not commit or push.

This historical migration copied 33 section records and page body content across 8 pages, retained 13 legacy sections for review, and removed `Pages.body` only after verifying the copy. Its desktop/mobile screenshots passed before the model was reworked; that historical result does not describe the current standard Pages renderer.

## Rework: standard EmDash pages

The previous custom Blocks-field design is retained as migration history, but is superseded by the simpler standard Pages model in `.audit/standard-page-model-design.md`.

- [x] Ground the design in EmDash's installed schema, Portable Text, image-picker, menu, and Site settings behavior.
- [x] Compare standard Pages, custom rich-text blocks, and one-collection-per-template designs.
- [x] Replace `page_content` with the ordinary Pages Portable Text body and flatten legacy content in order.
- [x] Move weekly meal data to `meal_plans`, donation actions to an EmDash menu, and social profiles to Site settings.
- [x] Convert editable image URLs to native Media references and remove obsolete URL, TOC, CTA, meal, and social fields.
- [x] Preserve local content with an export backup, draft/revision guards, read-back validation, and an idempotent migration.
- [x] Verify the Pages editor and media picker in a real browser, generate/apply the seed, run the Astro build, and rerun the migration to confirm its already-migrated guard.
- [x] Update local run/migration instructions; leave deployment and Git state untouched.
- [ ] Achieve strict pixel-identical parity across the frozen desktop/mobile screenshots.
  - open: the latest full run reports 31 passed, 22 failed, and 1 skipped. Remaining differences are in current content/media rendering; the school page is 1 px taller. No screenshot baseline or tolerance was changed. The image-rendering trade-off remains open.

## Subsequent owner-approved cleanup

- [x] After a raw SQLite backup, permanently remove the unused `page_sections` collection (46 records) and the duplicate Projects collection after transferring its 3 entries to Donations. See `.audit/simplified-content-model-design.md`.
