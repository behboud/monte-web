# Simplified EmDash content model

## Workflow

- [x] Read the Principles section of the **poteto-mode** skill.
- [x] Phase A: Frame
  - [x] Ground first, then commit. Don't start the run until you can state:
    - [x] The definition of done as a falsifiable predicate (the **prove-it-works** principle skill).
    - [x] Scope, quantified: rough units and effort, plus the blockers grounding surfaced.
    - [x] The rigor level, biased high. One-way doors and high blast radius get more. Reversible low-stakes steps get less. Rigor is gates and artifacts, not "try harder".
    - [x] Present the framing and tradeoffs before committing to a long run. Reversible work proceeds (the **never-block-on-the-human** principle skill), but a multi-hour run earns one checkpoint.
- [x] Phase B: Design the workflow
  - [x] Decompose into atomic, independently-landable units. Sequence riskiest-unknown-first. Scaffold and verification come before features (the **foundational-thinking** principle skill).
  - [x] Build the verification harness before the work, with the baseline captured from the pre-change state, so the check reads as "old value vs new value".
  - [x] For one-way-door design decisions, run the **architect** skill (it runs **arena**). Skip it for mechanical work whose shape is already concrete.
  - [x] Decide what fans out. Parallelize only across seams, and give each worker its own worktree or branch (the **separate-before-serializing-shared-state** principle skill). Don't over-fan.
  - [x] Write the designed phase list down. That list is what the human reviews.
- [x] Phase C: Run the loop
  - [x] Each unit was checked against the generated seed, disposable databases, rendered routes, or browser tests before continuing.
  - [x] Apply the **sequence-verifiable-units** principle: schema/seed, readers/routes, migration, and local verification were checked in sequence.
  - [x] Inspect artifacts: validated seed JSON, EmDash schema/content responses, migration backup/output, browser snapshots, and Playwright results.
  - [x] Record both outcomes: migration and behavior checks are verified; strict pixel parity is still not verified (31 passed, 22 failed, 1 skipped, unchanged from the previous standard-page run). No snapshots or thresholds were changed.
- [x] Ground and quantify the existing EmDash schema, seeded entries, route ownership, migration states, and preserved page content.
- [x] Build and record a disposable baseline for the current pages and content before editing.
- [x] Compare two structurally distinct content models and record the chosen data shape before writing code.
- [x] Update Pages, Donations, and existing Supporters schemas and generated seed content.
- [x] Merge Standard and Section rendering, remove CMS template dispatch, and keep special routes explicit.
- [x] Extend the local migration with raw SQLite and JSON backups, collision checks, read-back verification, raw-repository media resolution, opt-in draft skipping, legacy-collection removal, and safe repeat behavior.
- [x] Verify clean seed, migration from the Blocks model, migration from the intermediate Portable Text model, the approved local-database migration, legacy-collection removal, Astro checks, and live routes on localhost.
- [x] Update the run guide and keep the decision trail accurate.
- [x] Phase D: Keep the audit trail
  - [x] Record the decision and results in `.audit/simplified-content-model-design.md`, this checklist, and `.audit/simplified-content-model.tsv`. The `show-me-your-work` skill is not available in this session; the work is committed locally and not pushed.
- [x] Phase E: Verify and hand back
  - [x] Check the Phase A predicate against seed data, disposable migrations, EmDash queries, live pages, and browser tests. Preserve the known strict screenshot failures as a separate, explicit limitation.
  - [x] Encode recurring safety requirements: migration enforces `localhost`, tests enforce `localhost`, and `test:ui` no longer builds/seeds the user's database.

## Throughput checkpoint

- [x] **Blocking first steps.** Grounding the schema, current routes, EmDash migration behavior, and the user-owned database boundary run before code changes.
- [x] **Independent workstreams.** n/a: This is one coupled schema, seed, renderer, and migration change; parallel writes would share the same content shape.
- [x] **Shared mutable state.** Back up the project `data.db` and uploads before the owner-approved migration; use independent disposable databases for test runs, and never stage local data or uploads.
- [x] **Smallest safe decomposition.** One owner is safest because schema, seed, routes, and migration all depend on the same Page and Donation shapes, and this Pi session exposes no subagent tool.

## Frame

- [x] Definition of done: the generated seed has no Pages template discriminator or redundant `/aktuelles` Page; a single `home` Page drives the home route and its news feed; donations and supporters are separate editable collections; standard and section pages use one renderer with optional section cards; the clean seed and both migration starting states preserve visible content and routes.
- [x] Quantify the work after grounding and define which checks run against a clone rather than the project database.
- [x] Present the selected model and tradeoffs before schema or data changes.

## Phase plan

- [x] Phase 1: Prove the proposed Pages, Donations, and Supporters data shape against existing routes and source content.
- [x] Phase 2: Capture current behavior, then update the seed generator and seed schema.
- [x] Phase 3: Update readers, route dispatch, and the shared generic page renderer.
- [x] Phase 4: Migrate old Pages and Projects on disposable databases, preserve full backups, and verify before dropping obsolete fields.
- [x] Phase 5: Verify build, seed, migration reruns, admin lists, and public pages in a real browser. The strict visual suite retains its prior 31-pass/22-fail/1-skip baseline.
- [x] Phase 6: Update run instructions and audit trail. Apply the approved migration and archive cleanup locally; commit the code without pushing.
