# Privacy requirements for the new website

## Purpose and scope

This document translates the privacy report supplied by email into checks for the new Hugo website in this repository. It is a technical and content inventory, not a legal assessment. The privacy advisor must approve the final hosting model, processing purposes, legal bases, consent wording, image permissions, and published privacy notice.

The email report is the source for the requirements. Its last section is incomplete and ends with "Vor allem ist zu b". The mapping below therefore covers every complete point in the supplied text and records where clarification is still needed.

The new site was checked from the repository and through the local site at `http://localhost:1313` on 20 September 2026. The check included:

- `npm run build` and inspection of the generated production assets.
- Fresh-browser visits to the main routes, including `/`, `/schule/`, `/spenden/`, `/foerderer/`, `/kontakt/`, `/datenschutz/`, and `/impressum/`.
- Browser request, cookie, local-storage, and session-storage inspection.
- Source and content searches for forms, embeds, analytics, cookies, external resources, donors, contact people, and photos.
- A visual review of the image assets that are referenced by the site.

The local Hugo server adds live-reload requests in development. Those requests are not part of the production inventory.

## Short result

The new site already fixes the specific Google Fonts problem from the old site. `Overpass` and `Playfair Display` are served from `static/fonts`, and the browser check found no request to Google Fonts or Google APIs while visiting the public pages.

The site is not yet ready for a privacy sign-off. The main open points are:

1. Production pages still load CSS and font files from `cdnjs.cloudflare.com`.
2. The production PWA service worker imports Workbox from `storage.googleapis.com`.
3. The privacy notice names WebhostOne, while the repository deploys to GitHub Pages. The actual production host must be decided and documented.
4. The privacy notice contains generic sections for analytics, cookies, Microsoft Teams, contact forms, and applications that do not match the functions currently implemented.
5. The new content publishes individual donor names and personal contact addresses without any consent record in the repository.
6. The site publishes photographs that appear to contain identifiable children or adults. No image consent register is present.
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
| Processing that is not necessary for the website's core purpose must not start before an explicit consent.    | Optional third-party resources load before any consent mechanism. The current consent component is disabled in `hugo.toml`.                                                                                 | **Open.** Remove the optional external resources, serve them locally, or implement consent-gated loading. Do not deploy with a banner that only appears after the requests already happened.                        |
| Technical processing and optional processing should be documented separately.                                 | The current privacy notice combines generic hosting, cookies, analytics, conference tools, applications, and contact-form text.                                                                             | **Open.** Rewrite the notice from the final technical inventory rather than editing the old template in place.                                                                                                      |

Evidence: `.github/workflows/main.yml:1-2,25-27,61-67` deploys to GitHub Pages. `content/de/pages/datenschutz.md:55-75` names WebhostOne and an AVV. `content/de/pages/datenschutz.md:185-206` describes server logs and email contact processing.

### Plugins and external resources

The report recommends removing optional plugins or loading them only after consent. The following resources exist in the new implementation:

| Resource or feature                     | Current behavior                                                                                                                                                               | Status                                                                                                                                                                        |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Google Web Fonts                        | Fonts are local. `assets/css/main.css:14-36` references `/fonts/*.woff2`; the browser check found no `fonts.googleapis.com` or `fonts.gstatic.com` request.                    | **Resolved.** Keep a regression test for this.                                                                                                                                |
| Google APIs / Google Maps               | Google Maps is disabled, but an unused Google Maps API key remains in `hugo.toml`. No active map was found.                                                                    | **Partly resolved.** Remove unused configuration and ensure maps cannot become active without a consent decision.                                                             |
| `cdnjs.cloudflare.com` jQuery mmenu CSS | `hugo.toml:385-387` emits a stylesheet request to cdnjs on every public page.                                                                                                  | **Open.** Vendor the CSS or replace it with local CSS.                                                                                                                        |
| Font Awesome fonts                      | The local theme CSS contains `@font-face` URLs to Font Awesome files on cdnjs. The browser check observed both brand and solid font requests from cdnjs.                       | **Open.** Vendor the required font files and CSS, replace the icons with local SVG/CSS, or obtain explicit approval for the connection.                                       |
| DNS preconnects and prefetches          | `layouts/partials/essentials/style.html:1-7` preconnects to `use.fontawesome.com` and cdnjs and prefetches `connect.facebook.net`.                                             | **Open.** Remove these hints when the corresponding third-party resources are removed. They are not needed for the public site's core purpose.                                |
| PWA service worker                      | The production page registers a service worker. `public/service-worker.js:1-3` imports Workbox from `https://storage.googleapis.com/workbox-cdn/releases/6.0.2/workbox-sw.js`. | **Open.** Either remove the PWA feature, or vendor Workbox and verify that the service worker uses only same-origin resources.                                                |
| YouTube support                         | The lazy JavaScript bundle contains a lite YouTube component, but no current content uses a YouTube element or iframe.                                                         | **Not currently present.** Keep it disabled until a consent-gated video component and privacy text exist.                                                                     |
| Mermaid                                 | An external Mermaid URL remains in configuration at `hugo.toml:346-347`, but no current page uses it.                                                                          | **Not currently present, with dead configuration.** Remove the unused setting or load a local copy only if diagrams are actually required.                                    |
| Mailchimp                               | A Mailchimp action URL remains in disabled subscription settings at `hugo.toml:359-362`; no newsletter form is rendered.                                                       | **Not currently present, with dead configuration.** Remove it or treat a future newsletter as a separate consent-gated feature.                                               |
| Social media                            | The footer has a Facebook outbound link. Articles expose share links. There are no social-media embeds.                                                                        | **Mostly resolved.** Outbound links do not load an embed during page load, but remove the Facebook prefetch and confirm the destination is the intended official profile.     |
| Other outbound links                    | The site links to the school login, Montessoribayern, and the school authority. These are user-initiated navigations, not automatic page-load connections.                     | **Needs documentation.** Keep them as ordinary outbound links and review the destination notices separately.                                                                  |
| CMS admin                               | `/admin/` loads Sveltia CMS from `unpkg.com` and uses a GitHub OAuth proxy. This is an editor-facing surface, not a public visitor feature.                                    | **Separate review needed.** Decide whether the admin route needs its own privacy and security documentation. Do not include it in the public-site allowlist without a reason. |

The browser check of the public local site observed the cdnjs stylesheet and Font Awesome font requests. It did not observe Google Fonts, Google APIs, YouTube, Mailchimp, Facebook, or a map request during normal page visits.

### Cookies and browser storage

| Requirement from the report                                              | Finding in the new site                                                                                                                                                                                                                                                   | Status and next step                                                                                                                                                                                                                                        |
| ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| The old site used `PHPSESSID` without consent.                           | A fresh browser context visiting the new public routes received no cookies. There is no PHP, session endpoint, or server form in this repository.                                                                                                                         | **Resolved for the current implementation.** Keep a fresh-context cookie check in the release test.                                                                                                                                                         |
| Necessary cookies may be exempt, while optional cookies require consent. | `params.cookies.enable = false` in `hugo.toml:340-344`. No cookie banner is rendered. The bundled cookie helper does not set a cookie during the tested flows.                                                                                                            | **Needs confirmation.** Keep the banner disabled only if the final site has no optional cookie or terminal-storage use that requires consent.                                                                                                               |
| Terminal storage must also be considered, not just cookies.              | The donation popup reads and writes `sessionStorage` under `monte-donation-highlight-dismissed` when a visitor dismisses it. It does not use a cookie or `localStorage`. A fresh `/spenden/` visit showed no cookie; after dismissal the session-storage key was present. | **Open for legal classification.** Ask the privacy advisor whether this short-lived dismissal preference is necessary for the requested function. If not, remove it or include it in the consent decision. Document it in the privacy notice if it remains. |
| A consent choice must be withdrawable.                                   | There is no consent manager and no preference center.                                                                                                                                                                                                                     | **Not applicable only if optional processing is removed.** If any optional service remains, add reject, accept, and later-withdraw controls and test that no service loads before consent.                                                                  |

Evidence: `assets/js/main.js:143-182` implements the donation popup storage. `hugo.toml:340-344` disables the theme cookie banner. `layouts/partials/essentials/script.html:51-58` registers the production PWA and includes the cookie-consent partial.

### Privacy notice content

| Point from the report                                                 | Finding in the new site                                                                                                                                                                                                                                                                                                                                   | Status and next step                                                                                                                                                                      |
| --------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Remove references to obsolete law and processing that does not occur. | The new notice still reads like a generic template. It describes possible contact forms at lines 36-42, cookies at lines 171-183, analytics at lines 49-53 and 208-210, Microsoft Teams at lines 212-245, and online application processing at lines 247-263. The site currently has no contact form, analytics, Teams embed, or online application form. | **Open.** Remove unsupported sections or rewrite them as clearly separate organization-level processing only if the advisor confirms they belong in this website notice.                  |
| Describe analytics only if analytics are used.                        | The notice first says browsing behavior may be analyzed, then says no external analytics tools are currently used. No analytics implementation was found.                                                                                                                                                                                                 | **Open.** Replace the contradictory text with the final, factual statement.                                                                                                               |
| Name the actual host and contractual arrangement.                     | The deployment workflow targets GitHub Pages, while the notice names WebhostOne GmbH and an AVV.                                                                                                                                                                                                                                                          | **Open and release-blocking.** Confirm which host will serve the relaunched domain. Obtain or document the correct agreement and update the notice.                                       |
| Include processing caused by affiliate or donation links.             | No Bildungsspender reference or affiliate link was found in the repository.                                                                                                                                                                                                                                                                               | **Not currently present.** If Bildungsspender is added, record the exact link flow, recipient, data transfer, legal basis, notice text, and any consent requirement before publishing it. |
| Make the notice match the actual site functions.                      | The current notice mentions cookies and services that are not present and does not mention the current third-party CDN, Workbox import, session-storage dismissal key, or the final host.                                                                                                                                                                 | **Open.** Produce a new notice after the technical and content decisions below are complete.                                                                                              |

Evidence: `content/de/pages/datenschutz.md:36-75,104-128,169-210,212-263`. The current content search found no `bildungsspender` reference.

### Photos and identifiable people

The report requires a valid, voluntary consent for published photographs, with particular care for employees and children.

The new site publishes photographs that appear to include identifiable children or adults. Current content references include:

- `content/de/schule/_index.md:18-22`, which uses `16-_DSC7588.jpg` and `12-_DSC7076.jpg` in section cards.
- `content/de/schule/_index.md:50-67`, which uses `6-_DSC7336.jpg` and `12-_DSC7076.jpg` in school content.
- `content/de/schule/_index.md:120-125`, which uses `Freiarbeit_1.jpeg` and a school graphic.
- `content/de/spenden/_index.md:5-10`, which uses school images in the donation page.

A visual review of the assets shows children and adults in several of these photos. The repository contains no consent register, expiry date, withdrawal process, or link between a photo and its permission.

Status: **Open and release-blocking for each identifiable image.** Before publishing, create an image register outside the public site or in the agreed internal system. It should identify the file, people or group shown, purpose, channel, consent or other approved basis, date, expiry or review date, and removal procedure. Replace images with buildings, objects, landscapes, or approved non-identifying images where the record is missing.

### Contact information and contact people

The report asks for a necessity and permission check for staff and other contact people.

The new contact page publishes role addresses and individual addresses for class leadership and fundraising:

- `content/de/pages/kontakt.md:25-32` publishes addresses for school leadership, management, and administration.
- `content/de/pages/kontakt.md:55-70` publishes four class-leadership addresses and an individual fundraising address.
- `content/de/pages/impressum.md:28-30,46-48` publishes the board and managing director names.

Status: **Open for content approval.** Prefer role-based mailboxes for routine contact. For every named person or personal mailbox, record the purpose, necessity, permission or other approved basis, and removal process. Keep legally required imprint information only after the responsible organization confirms that the current people and roles are correct.

The site has no contact form. It uses `mailto:` links and telephone information. If a form, application upload, or ticket system is added later, it needs a separate data-flow design, retention period, security controls, and privacy-notice section before it is enabled.

### Donors and supporters

The report specifically warns against publishing individual supporters or donors without prior privacy review.

The new site already contains exactly this risk:

- `content/de/spenden/_index.md:20-28` names `Jürgen Steinheimer`, `Spielgenuß (Gisela Wöhrl)`, and `Privater Spender`, including donation descriptions and a EUR 10,000 amount.
- The same file lists organizations and describes their donations or funded projects at lines 29-55.

Status: **Open and release-blocking for the affected entries.** Remove individual names, private-donor labels, donation amounts, and identifiable descriptions until written approval exists. For organizations, confirm the correct name, the permission to publish the relationship and support description, and whether a logo or link is approved. A safer default is to publish project descriptions without naming a private donor.

No Bildungsspender link is currently present. The donation page and the `foerderer` page are separate from that affiliate requirement, but any external donation or affiliate destination must be reviewed before it is added.

## Recommended implementation plan

### Phase 0: decisions before code changes

1. Confirm the production domain and host. The repository currently deploys to GitHub Pages, while the draft notice names WebhostOne. Do not rewrite the notice until this is settled.
2. Confirm whether the PWA/offline cache is needed. If it is not needed, remove the PWA module and its service-worker registration.
3. Decide whether Font Awesome and mmenu remain. The preferred privacy path is to serve all required CSS and fonts locally or replace them with local SVG/CSS icons.
4. Confirm whether the relaunched site will ever include analytics, videos, maps, newsletter signup, contact forms, online applications, Teams links, or Bildungsspender. Features that are not required should stay out of the build.
5. Obtain the photo and donor decisions from the responsible organization. Code cannot establish whether a person consented to publication.
6. Send the completed technical inventory to the privacy advisor and request the final privacy-notice text after the hosting and feature decisions are known.

### Phase 1: remove automatic third-party connections

1. Vendor the mmenu CSS or replace it with local styling.
2. Vendor the Font Awesome resources used by the site, replace them with local SVGs, or remove the dependency.
3. Remove the Font Awesome, cdnjs, and Facebook preconnect or prefetch hints.
4. Remove the PWA integration or vendor Workbox locally. Verify the production service worker does not import a third-party URL.
5. Remove unused Mermaid, Mailchimp, and Google Maps configuration. Keep no dormant third-party URL in the public configuration unless the feature has an approved owner and implementation plan.
6. Keep the local Google-font setup and its existing regression test.
7. Keep outbound links as user-initiated links. Do not turn them into embeds or automatic requests without a consent design.

### Phase 2: clean and approve content

1. Temporarily remove or anonymize the three individual donor entries and any private-donor amount or description.
2. Review every organization listed on the donation page and record approval for its name, support statement, logo, and link.
3. Create the image register and remove any image without an approved publication basis. Prefer non-identifying images where possible.
4. Replace personal staff email addresses with role mailboxes where the school can support that choice.
5. Verify the imprint names and the editorially responsible person with the responsible organization.
6. Do not add a contact form, newsletter, video, map, application upload, or affiliate link until its processing is designed and approved.

### Phase 3: rewrite the privacy notice

Write `content/de/pages/datenschutz.md` from the deployed system, not from the generic template. It should cover only the services that exist and should identify, as applicable:

- responsible organization and data-protection contact;
- final host, server logs, IP handling, retention, and contractual arrangement;
- local fonts and local assets;
- the final third-party resource inventory, if any remains;
- session storage and service-worker/cache behavior if retained;
- email and telephone contact initiated by the visitor;
- external links and any donation or affiliate flow;
- image and donor publication only where the responsible organization has approved the content;
- rights, contact details, and the correct version of the applicable legal text.

Remove generic analytics, cookie, Teams, form, and application sections when those functions are not part of the website. If they describe separate organizational processes, the privacy advisor should decide whether they belong on this page or in a separate notice.

### Phase 4: consent decision and implementation

There are two acceptable product shapes, subject to legal approval:

1. **No optional services.** Keep the public site same-origin and local. Remove the disabled generic cookie banner and document only necessary technical processing and any approved session storage.
2. **Optional services remain.** Add a real consent mechanism. It must default to no optional processing, prevent the request before consent, record the choice, provide a later withdrawal path, and load each service only after the relevant choice.

A banner that appears after cdnjs, Google Cloud, video, analytics, or other optional requests have already happened does not solve the problem described in the report.

## Test and release contract

Add or maintain automated checks for the production build:

- A fresh browser context receives no cookies before an approved feature is used.
- Public page loads make no third-party requests before consent, unless the privacy advisor has explicitly approved the request as necessary.
- No requests go to `fonts.googleapis.com` or `fonts.gstatic.com`.
- No generated public HTML contains an active iframe, analytics script, contact form action, newsletter action, or video embed unless its consent behavior is tested.
- The production service worker is either absent or uses only approved same-origin resources.
- The donation dismissal behavior is documented and tested for its storage choice.
- Content tests or a release checklist catch personal donor names, private donation amounts, and photo references without an approval record.
- Every external URL in generated public HTML is classified as either an approved resource or a user-initiated outbound link.
- The final privacy notice names the same host and services that the production build actually uses.

The release sequence should be:

1. build the production site;
2. run the automated network, storage, and content checks;
3. manually inspect the main routes in a fresh browser profile;
4. send the generated resource inventory and content register to the privacy advisor;
5. deploy only after the technical and content decisions are approved;
6. repeat the network check against the deployed domain.

## Items that need an answer from the responsible organization

- Will the new public site remain on GitHub Pages, or will it be hosted by WebhostOne or another provider?
- Is the PWA/offline cache required?
- Should the site use Font Awesome and mmenu, or should these be replaced with local assets?
- Which, if any, of analytics, maps, videos, newsletter signup, contact forms, application uploads, Teams links, and Bildungsspender are part of the launch?
- Which donor names, donation descriptions, and organization names have written approval for publication?
- Which people shown in the active photographs have valid permission for this website, and until when?
- Which named contact people and personal mailboxes are necessary to publish?
- Does the CMS admin route need a separate privacy and security review?
- Can the privacy advisor provide the final privacy notice after the hosting and feature decisions are made?

## Evidence index

- Hosting and deployment: `.github/workflows/main.yml:1-2,25-27,61-92`
- External CSS and preconnects: `hugo.toml:364-423`, `layouts/partials/essentials/style.html:1-23`
- Local fonts: `assets/css/main.css:14-36`, `static/fonts/`
- PWA registration and cookie partial: `layouts/partials/essentials/script.html:45-62`
- PWA external Workbox import: generated `public/service-worker.js:1-10`
- Donation session storage: `assets/js/main.js:143-182`
- Current privacy notice: `content/de/pages/datenschutz.md:23-263`
- Contact people and mailboxes: `content/de/pages/kontakt.md:22-75`
- Imprint names: `content/de/pages/impressum.md:19-52`
- Donors and supporters: `content/de/spenden/_index.md:19-55`
- Current school image references: `content/de/schule/_index.md:5-27,50-67,120-186`
- CMS-only external script: `static/admin/index.html:7-8`
