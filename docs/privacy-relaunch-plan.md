# Privacy requirements for the new website

## Purpose and scope

This document translates the privacy report supplied by email into checks for the new Hugo website in this repository. It is a technical and content inventory, not a legal assessment. The privacy advisor must approve the final hosting model, processing purposes, legal bases, consent wording, image permissions, and published privacy notice.

The email report is the source for the requirements. Its last section is incomplete and ends with "Vor allem ist zu b". The mapping below therefore covers every complete point in the supplied text and records where clarification is still needed.

This plan is limited to technical remediation. It does not change, remove, anonymize, or rewrite published content. Content permissions, the final privacy notice, and the hosting details remain follow-up decisions for later iterations.

The new site was checked from the repository and through the local site at `http://localhost:1313` on 20 September 2026. The check included:

- `npm run build` and inspection of the generated production assets.
- Fresh-browser visits to the main routes, including `/`, `/schule/`, `/spenden/`, `/foerderer/`, `/kontakt/`, `/datenschutz/`, and `/impressum/`.
- Browser request, cookie, local-storage, and session-storage inspection.
- Source and content searches for forms, embeds, analytics, cookies, external resources, donors, contact people, and photos.
- A visual review of the image assets that are referenced by the site.

The local Hugo server adds live-reload requests in development. Those requests are not part of the production inventory.

## Short result

The new site already fixes the specific Google Fonts problem from the old site. `Overpass` and `Playfair Display` are served from `static/fonts`, and the browser check found no request to Google Fonts or Google APIs while visiting the public pages.

The technical remediation in this plan is implemented and verified. The site is not yet ready for a complete privacy sign-off because the remaining hosting, notice, and publication-permission decisions are organizational follow-up:

1. Required mmenu and Font Awesome CSS/font assets are now served locally. Fresh-browser checks found no external requests on the public routes.
2. Offline/PWA support was removed. The production build no longer emits a manifest or service worker and no longer imports Workbox.
3. The privacy notice names WebhostOne, while the repository workflow targets GitHub Pages. The actual production host is not known yet and must be updated later when it is decided.
4. The privacy notice contains generic sections for analytics, cookies, Microsoft Teams, contact forms, and applications that do not match the functions currently implemented. The feature inventory needs to be revisited with every iteration.
5. The new content publishes individual donor names and personal contact addresses without any consent record in the repository. This remains a follow-up review; this technical plan does not change the content.
6. The site publishes photographs that appear to contain identifiable children or adults. No image consent register is present. CMS review markers can make the follow-up easier, but they must not hide or remove content.
7. There is no consent banner. That is acceptable only if the final site uses no optional processing that requires consent and the remaining storage and external requests are approved.

## Requirement mapping

Status values:

- **Resolved for the current implementation** means the check found no matching issue, but the item still needs to remain in the release checklist.
- **Open** means the new site has the issue or has no control that addresses it.
- **Needs confirmation** means the repository cannot establish the fact. A responsible person or the privacy advisor must decide it.
- **Not currently present** means no implementation was found. It must be revisited before adding the feature.

### Technical processing and legal basis

| Requirement from the report                                                                                   | Finding in the new site                                                                                                                                                                                     | Status and next step                                                                                                                                                                                                |
| ------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A website processes technical metadata such as IP address, browser, and operating system to deliver the site. | The site is a static Hugo build, but the deployment workflow determines which host and server logs process those requests. The privacy notice currently describes generic server logs and names WebhostOne. | **Needs confirmation.** Confirm the production domain, hosting provider, log fields, retention period, and applicable legal basis with the privacy advisor. Then make the privacy notice match the actual provider. |
| Processing that is not necessary for the website's core purpose must not start before an explicit consent.    | Required mmenu and Font Awesome resources are now local. The consent component remains disabled in `hugo.toml`; no optional public service is currently implemented.                                        | **Resolved for the current implementation.** Revisit any future optional service with a separate consent design; do not deploy a banner after requests already happened.                                            |
| Technical processing and optional processing should be documented separately.                                 | The current privacy notice combines generic hosting, cookies, analytics, conference tools, applications, and contact-form text.                                                                             | **Follow-up.** Rewrite or replace the notice only after the host and feature inventory are known; that content change is outside this technical plan.                                                               |

Evidence: `.github/workflows/main.yml:1-2,25-27,61-67` deploys to GitHub Pages. `content/de/pages/datenschutz.md:55-75` names WebhostOne and an AVV. `content/de/pages/datenschutz.md:185-206` describes server logs and email contact processing.

### Plugins and external resources

The report recommends removing optional plugins or loading them only after consent. The following resources exist in the new implementation:

| Resource or feature                     | Current behavior                                                                                                                                                                             | Status                                                                                                                                                                        |
| --------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Google Web Fonts                        | Fonts are local. `assets/css/main.css:14-36` references `/fonts/*.woff2`; the browser check found no `fonts.googleapis.com` or `fonts.gstatic.com` request.                                  | **Resolved.** Keep a regression test for this.                                                                                                                                |
| Google APIs / Google Maps               | Google Maps is disabled, but an unused Google Maps API key remains in `hugo.toml`. No active map was found.                                                                                  | **Partly resolved.** Keep maps disabled and revisit the feature/configuration inventory in each iteration; no map is enabled by this plan.                                    |
| `cdnjs.cloudflare.com` jQuery mmenu CSS | `hugo.toml` now points the existing plugin pipeline at the vendored `assets/plugins/mmenu/mmenu.css`; the browser check found no cdnjs request.                                              | **Resolved for the current implementation.** Keep the pinned local asset and its mobile-menu regression test.                                                                 |
| Font Awesome fonts                      | `assets/plugins/font-awesome/v6/` contains the required CSS, and `static/fonts/font-awesome/` contains the brand and solid WOFF2 files. The browser check found no Font Awesome CDN request. | **Resolved for the current implementation.** Keep the local files, license notice, and icon regression coverage.                                                              |
| DNS preconnects and prefetches          | `layouts/partials/essentials/style.html` no longer emits Font Awesome, cdnjs, or Facebook connection hints.                                                                                  | **Resolved for the current implementation.** Keep the public stylesheet pipeline free of unnecessary third-party hints.                                                       |
| PWA service worker                      | The PWA module, manifest output, registration, and generated service worker were removed. The clean production build contains no Workbox URL.                                                | **Resolved for the current implementation.** Keep offline support out of the public build unless a separately reviewed requirement is introduced.                             |
| YouTube support                         | The lazy JavaScript bundle contains a lite YouTube component, but no current content uses a YouTube element or iframe.                                                                       | **Not currently present.** Keep it disabled until a consent-gated video component and privacy text exist.                                                                     |
| Mermaid                                 | An external Mermaid URL remains in disabled configuration at `hugo.toml:346-347`, but no current page uses it.                                                                               | **Not currently present.** Keep it disabled and revisit the feature/configuration inventory in a later iteration.                                                             |
| Mailchimp                               | A Mailchimp action URL remains in disabled subscription settings at `hugo.toml:359-362`; no newsletter form is rendered.                                                                     | **Not currently present.** Keep it disabled and revisit the feature/configuration inventory in a later iteration.                                                             |
| Social media                            | The footer has a Facebook outbound link. Articles expose share links. There are no social-media embeds, and the Facebook prefetch hint was removed.                                          | **Mostly resolved.** Outbound links do not load an embed during page load; confirm the destination is the intended official profile during the content follow-up.             |
| Other outbound links                    | The site links to the school login, Montessoribayern, and the school authority. These are user-initiated navigations, not automatic page-load connections.                                   | **Needs documentation.** Keep them as ordinary outbound links and review the destination notices separately.                                                                  |
| CMS admin                               | `/admin/` loads Sveltia CMS from `unpkg.com` and uses a GitHub OAuth proxy. This is an editor-facing surface, not a public visitor feature.                                                  | **Separate review needed.** Decide whether the admin route needs its own privacy and security documentation. Do not include it in the public-site allowlist without a reason. |

The browser check of the public local site observed no external requests on the checked public routes. It did not observe Google Fonts, Google APIs, YouTube, Mailchimp, Facebook, Font Awesome CDN, cdnjs, Workbox, or a map request during normal page visits.

### Cookies and browser storage

| Requirement from the report                                              | Finding in the new site                                                                                                                                                                                                                                                   | Status and next step                                                                                                                                                                                                                                        |
| ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| The old site used `PHPSESSID` without consent.                           | A fresh browser context visiting the new public routes received no cookies. There is no PHP, session endpoint, or server form in this repository.                                                                                                                         | **Resolved for the current implementation.** Keep a fresh-context cookie check in the release test.                                                                                                                                                         |
| Necessary cookies may be exempt, while optional cookies require consent. | `params.cookies.enable = false` in `hugo.toml:340-344`. No cookie banner is rendered. The bundled cookie helper does not set a cookie during the tested flows.                                                                                                            | **Needs confirmation.** Keep the banner disabled only if the final site has no optional cookie or terminal-storage use that requires consent.                                                                                                               |
| Terminal storage must also be considered, not just cookies.              | The donation popup reads and writes `sessionStorage` under `monte-donation-highlight-dismissed` when a visitor dismisses it. It does not use a cookie or `localStorage`. A fresh `/spenden/` visit showed no cookie; after dismissal the session-storage key was present. | **Open for legal classification.** Ask the privacy advisor whether this short-lived dismissal preference is necessary for the requested function. If not, remove it or include it in the consent decision. Document it in the privacy notice if it remains. |
| A consent choice must be withdrawable.                                   | There is no consent manager and no preference center.                                                                                                                                                                                                                     | **Not applicable only if optional processing is removed.** If any optional service remains, add reject, accept, and later-withdraw controls and test that no service loads before consent.                                                                  |

Evidence: `assets/js/main.js:143-182` implements the donation popup storage. `hugo.toml:340-344` disables the theme cookie banner. `layouts/partials/essentials/script.html:45-56` includes the cookie-consent partial; PWA registration has been removed.

### Privacy notice content

| Point from the report                                                 | Finding in the new site                                                                                                                                                                                                                                                                                                                                   | Status and next step                                                                                                                                                                      |
| --------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Remove references to obsolete law and processing that does not occur. | The new notice still reads like a generic template. It describes possible contact forms at lines 36-42, cookies at lines 171-183, analytics at lines 49-53 and 208-210, Microsoft Teams at lines 212-245, and online application processing at lines 247-263. The site currently has no contact form, analytics, Teams embed, or online application form. | **Follow-up.** No notice content is changed in this technical plan. Revisit the wording after the host and feature inventory are known.                                                   |
| Describe analytics only if analytics are used.                        | The notice first says browsing behavior may be analyzed, then says no external analytics tools are currently used. No analytics implementation was found.                                                                                                                                                                                                 | **Follow-up.** Keep analytics out of the current implementation and resolve the wording in the later privacy-notice update.                                                               |
| Name the actual host and contractual arrangement.                     | The deployment workflow targets GitHub Pages, while the notice names WebhostOne GmbH and an AVV.                                                                                                                                                                                                                                                          | **Follow-up.** The host is not known today. Update the deployment documentation and notice later, after the provider is decided.                                                          |
| Include processing caused by affiliate or donation links.             | No Bildungsspender reference or affiliate link was found in the repository.                                                                                                                                                                                                                                                                               | **Not currently present.** If Bildungsspender is added, record the exact link flow, recipient, data transfer, legal basis, notice text, and any consent requirement before publishing it. |
| Make the notice match the actual site functions.                      | The current notice mentions cookies and services that are not present and does not yet describe the session-storage dismissal key or final host. The required public CSS, fonts, and PWA path are now local/removed.                                                                                                                                      | **Follow-up.** Produce the factual notice after the technical inventory and host decision; no notice rewrite is part of this plan.                                                        |

Evidence: `content/de/pages/datenschutz.md:36-75,104-128,169-210,212-263`. The current content search found no `bildungsspender` reference.

### Photos and identifiable people

The report requires a valid, voluntary consent for published photographs, with particular care for employees and children.

The new site publishes photographs that appear to include identifiable children or adults. Current content references include:

- `content/de/schule/_index.md:18-22`, which uses `16-_DSC7588.jpg` and `12-_DSC7076.jpg` in section cards.
- `content/de/schule/_index.md:50-67`, which uses `6-_DSC7336.jpg` and `12-_DSC7076.jpg` in school content.
- `content/de/schule/_index.md:120-125`, which uses `Freiarbeit_1.jpeg` and a school graphic.
- `content/de/spenden/_index.md:5-10`, which uses school images in the donation page.

A visual review of the assets shows children and adults in several of these photos. The repository contains no consent register, expiry date, withdrawal process, or link between a photo and its permission.

Status: **Follow-up review required for each identifiable image.** The technical implementation must not remove, replace, or hide any current image. Instead, add CMS guidance and optional publication-review metadata where the existing content structure supports it. The follow-up register or agreed internal system should identify the file, people or group shown, purpose, channel, consent or other approved basis, date, expiry or review date, and removal procedure.

### Contact information and contact people

The report asks for a necessity and permission check for staff and other contact people.

The new contact page publishes role addresses and individual addresses for class leadership and fundraising:

- `content/de/pages/kontakt.md:25-32` publishes addresses for school leadership, management, and administration.
- `content/de/pages/kontakt.md:55-70` publishes four class-leadership addresses and an individual fundraising address.
- `content/de/pages/impressum.md:28-30,46-48` publishes the board and managing director names.

Status: **Follow-up review required; no content edit is part of this plan.** The responsible organization can later record the purpose, necessity, permission or other approved basis, and review/removal process for each named person or mailbox. The technical CMS markers described below may support that record, but they do not change the rendered contact or imprint content.

The site has no contact form. It uses `mailto:` links and telephone information. If a form, application upload, or ticket system is added later, it needs a separate data-flow design, retention period, security controls, and privacy-notice section before it is enabled. Revisit that feature inventory during each iteration.

### Donors and supporters

The report specifically warns against publishing individual supporters or donors without prior privacy review.

The new site already contains exactly this risk:

- `content/de/spenden/_index.md:20-28` names `Jürgen Steinheimer`, `Spielgenuß (Gisela Wöhrl)`, and `Privater Spender`, including donation descriptions and a EUR 10,000 amount.
- The same file lists organizations and describes their donations or funded projects at lines 29-55.

Status: **Follow-up review required; no content edit is part of this plan.** Keep the current donor and supporter content unchanged. Add CMS guidance and optional publication-review metadata to donor/supporter entries so the responsible organization can record the review status, reference, and review date without hiding or deleting an entry. Review the correct name, permission to publish the relationship and support description, logo, link, donation description, and amount later.

No Bildungsspender link is currently present. The donation page and the `foerderer` page are separate from that affiliate requirement, but any external donation or affiliate destination must be reviewed before it is added. Revisit this feature inventory during each iteration.

## Recommended technical implementation plan

### Scope boundary

This plan covers technical remediation only. It does not change, remove, anonymize, or rewrite any content in `content/`. The donor, supporter, photograph, contact-person, imprint, and privacy-notice findings remain follow-up work for later iterations. No technical check may hide or delete an entry because its review marker is still open.

The production host is not known today. Do not update the privacy notice or deployment provider description in this plan; update those later once the host is decided. Offline/PWA support is not needed. Font Awesome and mmenu are required and should remain, served locally.

The inventory of optional features (analytics, maps, video, newsletter, contact forms, applications, Teams, and Bildungsspender) must be revisited at every iteration. No new feature should be enabled merely because a dormant configuration value exists.

### Files to modify

- `hugo.toml`, `go.mod`, and `go.sum` for module/output cleanup and local plugin paths.
- `layouts/partials/essentials/head.html` and `layouts/partials/essentials/script.html` for manifest and service-worker removal.
- `layouts/partials/essentials/style.html` for removal of third-party connection hints.
- New local vendor assets under `assets/plugins/mmenu/`, `assets/plugins/font-awesome/`, and the corresponding local font directory, including the applicable Font Awesome license notice.
- `static/admin/config.yml` for CMS hints and optional publication-review metadata.
- `tests/ui/privacy-regression.spec.ts` and `tests/ui/admin.spec.ts` (or the existing equivalent suites) for network, storage, build, and CMS checks.
- No `content/` file is modified by this technical plan.

### Reuse

- Reuse the existing `params.plugins.css` pipeline in `hugo.toml` and `resources.Get` handling in `layouts/partials/essentials/style.html` rather than adding a second stylesheet mechanism.
- Reuse the local JavaScript dependency already imported by `assets/js/app.js` for mmenu behavior; only its CSS delivery changes.
- Preserve the existing Font Awesome class names and the local Google-font setup, so templates and visual styling do not need a content migration.
- Reuse the existing UI test harness and fresh-browser checks in `tests/ui/`.
- Sveltia supports field-level `comment` and `hint` text, and image metadata can be modeled as fields alongside an image in an object. Use those supported controls rather than inventing a CMS plugin. See the [Sveltia field options](https://sveltiacms.app/en/docs/fields) and [image field](https://sveltiacms.app/en/docs/fields/image) documentation.

### Steps

1. **Remove the unnecessary PWA path.** Remove the PWA module dependency/import, `WebAppManifest` output, manifest link, production service-worker registration, and any generated service-worker template that imports Workbox. Run the normal Hugo module cleanup as part of implementation and verify that the production build contains neither `public/service-worker.js` nor a Workbox URL.
2. **Serve mmenu locally.** Pin the currently used mmenu release from the existing npm dependency, copy its required CSS into the Hugo asset pipeline, and change the existing `hugo.toml` plugin entry from the cdnjs URL to that local asset. Keep the existing local JavaScript bundle and verify that mmenu still opens and closes at mobile breakpoints.
3. **Serve Font Awesome locally.** Vendor the Font Awesome CSS files and only the brand/solid font files used by the site. Rewrite their `@font-face` URLs to same-origin paths, retain the existing icon classes, and include the required license notice. Do not replace the required icon system with a different one in this pass.
4. **Remove third-party connection hints.** Delete the Font Awesome, cdnjs, and Facebook preconnect/DNS-prefetch entries from `layouts/partials/essentials/style.html`. Keep ordinary outbound links user initiated. Leave disabled optional integrations disabled and record them for the per-iteration feature review instead of enabling or silently changing their content.
5. **Add CMS review guidance without changing rendering.** Add field-level `comment`/`hint` text to image pickers explaining that publication permission must be checked. For existing structured gallery, donor, supporter, and project entries, add an optional `publication_review` object with a status/toggle, reference, review date, and optional review-until date. Use the same metadata for organization name/logo/link review where the entry schema supports it. The marker is administrative only: an open or negative status must never remove, hide, or alter the public entry.
6. **Handle image-picker limitations explicitly.** For bare multi-image fields that cannot store one review record per selected image without a frontmatter migration, add the CMS hint now and leave the content shape unchanged. Treat a per-image metadata migration as a later, separately approved iteration; do not rewrite existing content as part of this plan.
7. **Keep the current storage and feature boundary visible.** Preserve the current no-cookie public behavior and test the donation popup's `sessionStorage` key. Keep the consent banner disabled only while the public site has no optional processing that requires it. Revisit the legal classification of that short-lived storage and the optional-feature inventory in the follow-up review.

### Follow-up content and legal review (not a phase of this plan)

- Decide the eventual hosting provider and then update the deployment documentation and privacy notice to match it.
- Review donor names, private-donor labels, donation amounts/descriptions, organization names, logos, and links without changing the current content in this technical pass. Use the CMS metadata as a review aid, not as an automatic removal mechanism.
- Review each identifiable photograph and each named contact person/mailbox, including the imprint, using the agreed register or approval process. Do not remove, replace, anonymize, or rewrite them as part of this technical work.
- Clarify the analytics, map, video, newsletter, contact-form, application, Teams, and Bildungsspender scope at each iteration. Do not add any of these features without a separate processing and consent design.
- After the host and feature inventory are known, ask the privacy advisor for the final notice text and decide how to classify the donation popup's session storage and the CMS admin route.

## Test and release contract

Add or maintain automated checks for the production build:

- A fresh browser context receives no cookies before an approved feature is used.
- Public page loads make no requests to `cdnjs.cloudflare.com`, `use.fontawesome.com`, `storage.googleapis.com`, or other unapproved third-party resources.
- No requests go to `fonts.googleapis.com` or `fonts.gstatic.com`.
- No generated public HTML contains an active iframe, analytics script, contact form action, newsletter action, or video embed unless its consent behavior is separately designed and tested.
- The production service worker and web-manifest output are absent because offline support is not needed.
- The donation dismissal behavior is documented and tested for its storage choice.
- Existing Font Awesome icons and mmenu behavior still work after the local asset switch.
- CMS config tests confirm that image and donor/supporter fields show the publication-review guidance and that review markers do not affect public rendering.
- Every external URL in generated public HTML is classified as either an approved resource or a user-initiated outbound link.

The technical release sequence should be:

1. build the production site;
2. run the automated network, storage, build, and CMS checks;
3. manually inspect the main routes in a fresh browser profile;
4. send the generated technical resource inventory to the privacy advisor;
5. complete the separate host, content, and privacy-notice follow-up before production deployment;
6. repeat the network check against the deployed domain once the host is known.

## Follow-up decisions for the responsible organization

- Which provider will host the public site? Update the deployment documentation and privacy notice after that decision; the host is not known today.
- Which of analytics, maps, videos, newsletter signup, contact forms, application uploads, Teams links, and Bildungsspender should remain out of scope or be designed in a later iteration? Revisit this list every iteration.
- Which donor names, donation descriptions, amounts, organization names, logos, and links have approval for publication? Keep the current content unchanged while this is reviewed.
- Which people shown in the active photographs have valid permission for this website, and until when? Keep the current images unchanged while this is reviewed.
- Which named contact people, personal mailboxes, and imprint details are approved and necessary? Make no content edit in this technical plan.
- Does the CMS admin route need a separate privacy and security review?
- Can the privacy advisor provide the final privacy notice after the hosting and feature decisions are made?

The CMS review fields proposed by this plan are a technical record aid. They do not constitute consent, and an unchecked or unresolved field must not automatically remove or hide content.

## Evidence index

- Hosting and deployment: `.github/workflows/main.yml:1-2,25-27,61-92`
- External CSS and preconnects: `hugo.toml:364-423`, `layouts/partials/essentials/style.html:1-23`
- Local fonts: `assets/css/main.css:14-36`, `static/fonts/`
- CMS image and supporter fields: `static/admin/config.yml:39-554`
- PWA removal and cookie partial: `layouts/partials/essentials/script.html:45-56`, `hugo.toml:118-161`
- Local vendor assets: `assets/plugins/mmenu/mmenu.css`, `assets/plugins/font-awesome/v6/`, `static/fonts/font-awesome/`
- Donation session storage: `assets/js/main.js:143-182`
- Current privacy notice: `content/de/pages/datenschutz.md:23-263`
- Contact people and mailboxes: `content/de/pages/kontakt.md:22-75`
- Imprint names: `content/de/pages/impressum.md:19-52`
- Donors and supporters: `content/de/spenden/_index.md:19-55`
- Current school image references: `content/de/schule/_index.md:5-27,50-67,120-186`
- CMS-only external script: `static/admin/index.html:7-8`
