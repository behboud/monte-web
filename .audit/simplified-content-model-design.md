# Simplified EmDash content model

## Problem

Pages currently require a `template` select, and `[page].astro` uses it to choose among several renderers. The request is to remove that choice from the editor, keep one home entry with the live news section, keep Donations and Supporters as editable content, and merge Standard and Section into one page form. At the design baseline, the local `data.db` had the earlier `page_content` Blocks schema, 13 Pages, 3 Projects, 12 Supporters, and 46 hidden `page_sections` records. The `aktuelles` Page has no body, slides, or cards. The existing Astro server at `localhost:4185` renders `/aktuelles/` from Posts already.

## Usage

An editor manages these records in EmDash:

- **Pages** holds one `home` entry and ordinary route content. Every Page uses the same fields. Section cards are optional.
- **News** holds individual articles. The home page shows the latest four, and `/aktuelles/` lists all published articles.
- **Donations** holds fundraising opportunities that visitors can support.
- **Supporters** holds the people and organizations already acknowledged on the donation page.
- **Meal plans** holds dated weekly menus.

The editor never chooses a page template. Astro's fixed routes own the special behavior. `/` reads `Pages.home`; `/spenden/` reads `Pages.spenden`, Donations, Supporters, and the donation-actions menu; `/foerderer/` reads `Pages.foerderer` and Donations; `/speiseplan/` reads `Pages.speiseplan` and Meal plans. `[page].astro` renders every other Page with the shared body-and-cards layout.

## Shape

```ts
interface PageData {
  title: string;
  description: string;
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

interface DonationData {
  title: string;
  sort_order: number;
  image: ImageValue | null;
  content: PortableTextBlock[];
  highlight: boolean;
  url: string;
}

interface SupporterData {
  title: string;
  sort_order: number;
  image: ImageValue | null;
  content: PortableTextBlock[];
}

function getSitePage(slug: string): Promise<SitePage | null>;
function getDonations(): Promise<Donation[]>;
function getSupporters(): Promise<Supporter[]>;
```

`PageData` has no template discriminator. The parser normalizes empty repeater fields to empty arrays, so renderers do not need template checks. The Donations shape reuses the three current Projects records, including the optional promotion URL and highlight flag used by the cards and popup. Supporters remains a separate type because it describes acknowledgements, not fundraising opportunities.

`src/pages/index.astro` owns the home route. `src/pages/aktuelles/index.astro` owns the news archive. New static Astro routes own `/spenden/`, `/foerderer/`, and `/speiseplan/`. `src/pages/[page].astro` loads a Page and renders one shared `ContentPage.astro`. This removes `PAGE_TEMPLATES`, the CMS select, and the Standard/Section renderer split.

## Synthesis decision

Choose one untyped-by-template Page model with optional page-owned cards. Keep route-specific behavior in explicit Astro routes instead of encoding it in the CMS record. This keeps the editor form uniform and makes a route's behavior visible in its route file. The section cards stay on their parent Page because they have no separate identity or editing lifecycle.

Rename the current Projects content concept to Donations in the public schema and renderer. The existing three records are fundraising opportunities with descriptions, images, highlights, and action URLs. Copy and verify those records in Donations, then remove the duplicate Projects collection; the raw database backup is the recovery path. Remove the unused `page_sections` archive after the same backup. Donations, Supporters, and Meal plans are list data rendered inside fixed Astro routes, so they are non-routable; Pages and News remain routable. Keep the two donation-action buttons in the native EmDash menu because they are page navigation actions, not individual fundraising opportunities.

The architect and how workflows call for parallel subagents, but this Pi session exposes no subagent tool. I compared the candidates serially against the installed EmDash schema, the current routes, and the local content. There is no independent-model cross-judge.

## Candidates

### A. One generic Page shape and fixed routes

Pages has common text and optional page-owned fields. Astro routes select the handful of special layouts. Donations and Supporters remain separate collections. This matches the editor request and uses the current fixed site routes without adding a page-builder abstraction.

### B. A template discriminator with optional fields

Keep `template` and let the route dispatcher pick a renderer. This has one query path, but it keeps the page type decision in every Page form and retains the template-dependent branch the request removes.

### C. Separate collections for Home, Standard pages, Section pages, Donations, and Meal plans

Each form could show only relevant fields. It would split Pages across admin lists and duplicate common title, description, and body fields. The current site has one home page and a small number of fixed special routes, so the extra collection boundaries do not represent separate lifecycles.

Candidate A wins because it removes the CMS discriminator and merges the standard and section editor flows without making editors assemble pages from custom blocks. Candidate B exposes template choice to every editor. Candidate C gives a narrower form at the cost of fragmented page editing and duplicated schema.

## Migration and verification

The migration supports the existing Blocks model and the intermediate Portable Text model. It writes both a raw SQLite snapshot and a JSON export before changes, converts published Page content and media, creates Donations from Projects, and verifies the new records before removing the legacy Projects and `page_sections` collections. `--ignore-drafts` is an explicit opt-in to migrate the published revision only; the raw snapshot preserves the pending draft. Legacy fields are removed only after read-back checks. It soft-deletes `Pages.aktuelles` only if that entry is still the empty news-list stub; otherwise it stops and preserves the record. The archive route continues to read Posts.

The existing `data.db` is not a test database. Copy it to a disposable path, run the migration against a localhost server backed by that copy, then verify record counts, links, image references, route responses, and an idempotent rerun. A clean seed must also pass EmDash seed validation. The existing visual snapshots and tolerances remain unchanged.

## Verification results

- `npm run test:content-model` passes; `emdash seed seed/seed.json --validate` passes. A clean temporary database accepted the final seed (5 collections, 33 entries, 20 media items), and `npm run build` completed with zero Astro/TypeScript errors. Donations, Supporters, and Meal plans are non-routable; only Pages and News have public entry routes.
- A disposable copy first verified the draft guard and the explicit `--ignore-drafts` path. With owner approval, the project `data.db` was then migrated from its published `schule` revision; the pending draft remains recoverable in the raw pre-migration SQLite backup. Read-back checks passed: 13 Pages were converted, the empty `aktuelles` stub was soft-deleted, 3 Projects became German-locale Donations, the old Projects and 46 `page_sections` records plus their 637 revisions were removed after backup, and all 12 Supporters and 5 News posts remained. Four missing legacy slider images were left empty as designed.
- A second disposable fixture started with the intermediate Pages + Portable Text + visible Projects model. Migration removed the template, copied the 3 Donations in locale `de`, made Donations and Supporters non-routable, removed Projects after transfer, soft-deleted the empty news Page, resolved source image URLs from the checked-in repository, and passed read-back verification.
- On the final migrated database, the read-only admin/interaction/privacy/asset-link suite passes (26 passed, 2 project-gated skips). Browser checks returned 200 for `/`, `/aktuelles/`, `/spenden/`, `/foerderer/`, `/speiseplan/`, and `/schule/`; donation cards, popup, news feed, optional section cards, and meal plan are present.
- The strict visual suite was rerun against the final database: 31 passed, 22 failed, 1 skipped. The public-links test also confirms self-hosted font URLs resolve under `/monte-web/`. No screenshot or pixel threshold was changed; pixel-identical parity is not claimed.

## Tradeoffs accepted

- Every Page form still shows optional `banner_title`, slider, and section-card fields because EmDash does not support conditional field visibility. The editor no longer sees template-only data such as meal, social, or CTA fields.
- Special page behavior lives in Astro route files. Adding a new special route requires code, not a CMS template value.
- Donations means fundraising opportunities, not a ledger of financial transactions. The existing data has three such opportunities and no payment records.
- The old Projects collection and 46-record `page_sections` archive are removed after a raw SQLite backup. Projects content is copied into Donations and verified before its source collection is deleted.
- The donation-actions menu remains a separate edit point for the two top-level links. Combining these links with fundraising cards would require a new rule for how each item is displayed.

## Further simplifications to consider

- Decide whether `banner_title` should remain separate from `title`. Several pages use different values for their breadcrumb and display heading, so merging them now would change visible text.
- Keep the slider repeater for this change. The home and several existing pages use it. If editors no longer need those sliders, the image fields could move into the Portable Text body and the repeater could be removed in a separate pass.
- Keep the donation-actions menu unless the two links no longer need editor control. Hardcoding them would remove one admin surface but make those labels and URLs code-owned.
- Keep `sort_order` on Donations and Supporters while editors need a chosen display order. If alphabetical order is acceptable, those fields and sort logic could be removed in a separate pass.
