# Astro and EmDash migration shape

## Problem

The Hugo site renders 39 pages from 18 Markdown files and custom templates. Its public output includes 24 routes used by the visual harness, five news articles, two tag archives, a weekly menu, donation cards, and a shared mobile menu. The existing GitHub Pages workflow emits static files under `/monte-web/`. EmDash needs an Astro server at request time, so that workflow cannot host the migrated CMS.

The task must preserve the current HTML, styles, photos, interactions, route paths, and base-path behavior while moving content into EmDash. The pre-change site is now captured at desktop and mobile viewports. No source template or baseline image may change to make a comparison pass.

## Usage (caller's view)

Editors manage page and project records in `/_emdash/admin`. The page route loads a page by slug, parses its template discriminator, then renders the matching Astro component. News pages query the `posts` collection and its tag taxonomy. The shared layout loads the EmDash navigation menus and uses the existing local assets.

The local runtime uses Astro's Node adapter, SQLite, and local media storage. The app keeps the existing route base configurable so local tests run at `/` and a prefixed build can be checked at `/monte-web/`.

## Shape

Use one `pages` collection with a required `template` select and shared title, description, banner, and Portable Text fields. The template values are `home`, `section`, `standard`, `donations`, `supporters`, and `meal-plan`. A discriminated page model at the query boundary selects the renderer. Section rows are a flat repeater with an explicit nesting level, stable anchor ID, title, label, optional image, and Portable Text content. Other repeaters hold the home and page sliders, section cards, donation buttons, donor cards, meal-plan days, and menu notes. This matches the source data without adding nested blocks, which EmDash does not support in block definitions.

Keep fundraising projects in a separate `projects` collection because the supporters page and donation popup share those records. Keep news in `posts`, with a custom display date and the existing `tag` taxonomy. Store the primary, footer, and social navigation in EmDash menus. Convert source Markdown to Portable Text at migration time and preserve its headings, links, lists, emphasis, quotes, and image references.

Keep the public DOM structure and the current stylesheet and script behavior. Copy the Hugo-generated image variants, local fonts, CSS, and JavaScript into Astro's public asset directory so the browser receives the same bytes. Prefix local links and image URLs through one base-path helper. Do not redesign the page or replace local fonts with a hosted font service.

The Node adapter and SQLite are the local default because they run without a cloud account and match EmDash's documented self-hosted setup. GitHub Pages remains a deployment blocker. The task does not deploy or change a remote host.

## Synthesis decision

I compared three shapes against route fidelity, CMS editing, schema clarity, and renderer complexity. A general page-builder blocks field would give editors arbitrary ordering and expose more layout choices than this fixed site needs. A separate collection for each page template would make fields more precise but scatter 18 pages across admin sections and duplicate common fields. The chosen single `pages` collection keeps page editing together and uses a template discriminator to retain the fixed layouts.

I retained separate `posts` and `projects` collections from the per-template alternative because they have distinct query and publishing lifecycles. I retained Portable Text and typed repeaters from the page-builder alternative without allowing editors to reorder the site's structural regions. No subagent tool is available in this Pi session, so I generated the candidates and performed the comparison serially. The review is not an independent-model cross-judge.

## Tradeoffs accepted

- The shared page form contains fields that apply only to some templates. In exchange, editors find all ordinary pages in one collection and the route code has one content lookup.
- The site keeps its original optimized photos as local static assets. In exchange, the first import makes no external requests and uses the same image bytes as Hugo.
- The local app uses Node and SQLite. In exchange, EmDash admin and server-rendered pages work locally without a cloud account. A production host still needs a separate decision.
- The visual baseline is tied to the captured Chromium version and viewport sizes. In exchange, the test can require a strict zero-pixel diff.

## Alternatives considered

- **Flexible page-builder blocks.** This allows arbitrary block order, but the existing page layouts are fixed and the extra editing freedom makes accidental visual changes more likely.
- **One collection per page template.** This makes each form precise, but it fragments the small site's pages and duplicates common fields.
- **One `pages` collection with a template discriminator.** This keeps route lookup and page editing together. A typed parser contains the optional-field complexity at the content boundary, so this is the recommended base.

## Open questions and risks

- Which server host should replace GitHub Pages for production? The current workflow is static-only, while the site privacy page names WebhostOne. Neither fact identifies a Node-capable host. The local migration uses Node and does not publish.
- Should existing photos become EmDash media-library records? The current source stores them as project assets. The local migration preserves them as local image values to avoid duplicating 7.3 MB of generated assets or downloading from another host.
- The baseline preserves the current legal text, including the stated hosting provider. The migration does not revise legal copy.

## Next implementation step

Create the Astro and EmDash runtime shell, apply the schema and seed locally, then verify the admin route and one public route before migrating the remaining templates.
