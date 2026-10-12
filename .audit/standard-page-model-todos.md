# Standard page model redesign

## Figure it out

- [x] Read the Principles section of the **poteto-mode** skill.
- [x] Phase A: Frame
- [x] Phase B: Design the workflow
- [x] Phase C: Run the loop
- [x] Phase D: Keep the audit trail
- [x] Phase E: Verify and hand back

## Phase A: Frame

- [x] Ground the current EmDash collections, page query/render path, Portable Text editor, media picker, and local database.
- [x] State the model and verification predicate before implementation: ordinary Pages Portable Text body, native Media, no TOC; keep data and route behavior, then run the frozen strict screenshots without changing references or tolerance.
- [x] Compare page-owned section cards, Portable Text, and separate collections.
- [x] Identify special data that belongs outside Pages: meal plans, donation buttons, and social links.
- [x] Confirm standard editor heading anchors and the HTML-block alias path.

## Phase B: Design the workflow

- [x] Use one ordinary Portable Text body on Pages, with only page-level fields that belong there.
- [x] Use native EmDash image references for body, slider, and section-card images.
- [x] Move meal data to its own collection and remove non-page fields from Pages.
- [x] Preserve local data with an export backup, revision checks, read-back validation, and an idempotent migration.
- [x] Sequence schema/seed, content migration, readers/renderers, and browser verification.

## Phase C: Run the loop

- [x] Implement and validate the standard schema and generated seed.
- [x] Migrate existing content/media and verify it before removing legacy fields.
- [x] Update page, meal-plan, donation, footer, and image rendering callers.
- [x] Verify the Pages editor, image picker, and separate Meal plans collection in a real browser.
- [x] Run the Astro build, apply a fresh seed to a disposable database, migrate a disposable existing database, and verify the idempotent rerun.
- [x] Run the full frozen desktop/mobile visual suite without changing snapshots or thresholds.
  - result: 31 passed, 22 failed, 1 skipped. The latest `schule` screenshot is one pixel taller; other exact-pixel differences remain in some current content/media renderings.

## Phase D: Keep the audit trail

- [x] Record decisions and outcomes in `.audit/standard-page-model-design.md`, `.audit/content-organization-todos.md`, and `.audit/content-organization.tsv`.
- [x] Preserve the custom-block implementation notes as historical context; document that they are superseded.

## Phase E: Verify and hand back

- [x] Confirm `/schule/` renders its whole page from the single Portable Text body and that section-card targets appear in the body.
- [x] Confirm automatic heading IDs are generated and the section-card links resolve to those targets in the rendered page.
- [x] Confirm affected image fields use Media references and the editor's Media picker lists the migrated files.
- [x] Confirm meal plans use their own collection and legacy meal/social/CTA/URL fields are removed from Pages.
- [x] Confirm the migration creates a backup, guards drafts/revisions, reads back changes, and exits safely when already migrated.
- [ ] Achieve strict pixel-identical parity across the frozen screenshots.
  - open: the current native EmDash media/content rendering differs slightly from the Hugo references. Keep the baselines and zero-pixel threshold unchanged; investigate a rendering adapter only if exact parity is still required.
- [x] Keep this local-only; no commit, push, deployment, or writes to the original `data.db` were made during verification.
