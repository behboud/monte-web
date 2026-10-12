# Local goal checklist — historical full-site migration

This checkpoint describes the earlier custom page-content implementation. The later standard Pages/Portable Text rework and its current verification results are recorded in `.audit/content-organization-todos.md`; the zero-diff result below is not the latest screenshot status.

## Figure it out

- [x] Read the Principles section of the **poteto-mode** skill.
- [x] Phase A: Frame
- [x] Phase B: Design the workflow
- [x] Phase C: Run the loop
- [x] Phase D: Keep the audit trail
- [x] Phase E: Verify and hand back

## Autonomous run

- [x] State the exit condition as a checkable predicate before the first iteration (tests green, repro fixed, all N PRs merged, pixel-diff zero).
- [x] Pick the wake mechanism using your harness's `/loop` command. This is a synchronous local migration with no external event to watch, so no watcher is needed.
- [x] Make the smallest evidence-backed change in each iteration and verify it before proceeding. This historical phase ended without a commit; the user later authorized one local commit and no push.
- [x] Handle mid-run discoveries locally. The Markdown rendering and image-diff failures were traced to their source and corrected. No unrelated PRs, questions, or irreversible actions were needed.
- [x] Checkpoint the work in `.audit/migrate-to-emdash.tsv`.
- [x] The earlier implementation reached its original stop predicate. The later standard Pages rework has separate strict-screenshot results recorded in the content-organization audit.

## Visual parity

- [x] Establish the baseline first, before any migration. The frozen harness and 53 desktop and mobile reference screenshots are in `tests/ui/visual-parity.spec.ts` and `tests/ui/visual-parity.spec.ts-snapshots/`.
- [x] Hold the anti-shortcut clauses. No baseline image or diff threshold was changed to make a comparison pass.
- [x] Migrate shared components serially in this worktree and verify each affected route before the full run.
- [x] The earlier implementation passed desktop/mobile pixel comparisons before the standard Pages rework. See the current rework audit for later screenshot differences.
- [ ] Run **Opening a PR** per component or safe batch.
  - skip: no PR was requested; commit the work locally and do not push.

## Feature throughput checkpoint

- [x] Run the Hugo build, existing Playwright suite, and frozen screenshot baseline before migration.
- [x] Keep the schema, route resolver, image helper, and layout work in one dependency chain.
- [x] Work serially in this worktree because routes share the EmDash schema and asset map.
- [x] Use one owner because this Pi session has no subagent tool and the page model is shared.

## Architect phases

- [x] Ground
- [x] Sketch
- [x] Agree
- [x] Implement
- [ ] Scrap
  - skip: the selected design passed route and screenshot checks, so no alternative needed to replace it.

## Designed implementation phases

- [x] Create the Astro and EmDash runtime shell, seed the page model, and verify schema application, the admin route, and public routes.
- [x] Migrate shared assets, the global layout, navigation, footer, and home page. Compare desktop and mobile screenshots before adding page families.
- [x] Migrate standard and section pages, then school, meal-plan, donation, and supporter layouts. Verify each family against its frozen routes.
- [x] Migrate news listing, article details, tag archives, 404 behavior, and admin and interaction tests.
- [ ] Preserve Hugo-generated RSS and Atom feeds in Astro.
  - open: no Astro feed route or feed-response test exists. The visual predicate does not cover XML feeds.
- [x] Remove Hugo build/runtime files and GitHub Pages deployment, rename the retained static runtime assets, and move seed-generation source data out of Hugo's root directories. Keep the source data only for reproducible EmDash seeding and migration.
  - result: `.github/workflows/ci.yml` validates the EmDash seed and Node build; no deployment runs until a Node host is selected.
- [x] Run the Astro build, type checks, behavior suite, and desktop/mobile screenshot suite for this historical implementation. Its captured routes passed with zero pixel differences.
- [x] Preserve relative self-hosted font URLs under the former GitHub Pages deployment prefix while removing the static-host workflow.
  - result: `tests/ui/public-links.spec.ts` confirms font URLs in the production CSS resolve under `/monte-web/`; the EmDash app still requires a Node host.
