# Montessori Schule Gilching

Astro site backed by EmDash CMS. The CMS and site run as a Node.js server with a persistent SQLite database and media directory.

## Local setup

Requirements: Node.js 20.19+ (or 22.12+).

```bash
npm install
npm run dev
```

Open `http://localhost:4173/`; the EmDash editor is at `http://localhost:4173/_emdash/admin/`. For local passkey setup, use the dev bypass shown by the server or visit:

```text
http://localhost:4173/_emdash/api/setup/dev-bypass?redirect=/_emdash/admin
```

The default database and uploads are `data.db` and `uploads/`; both are local state and are excluded from Git. Do not run the seed against a database with content you need to preserve.

## Content model

- **Pages**: `home` and standard pages share one form and renderer; section cards are optional page-owned content.
- **News**: articles feed the home page and `/aktuelles/` archive.
- **Donations**: editable fundraising opportunities shown on `/foerderer/` and in the donation highlight.
- **Supporters**: acknowledgements shown on the donation page.
- **Meal plans**: weekly menus shown on `/speiseplan/`.

Only Pages and News have public entry routes. Donations, Supporters, and Meal plans are non-routable list data. Legacy Projects were copied to Donations, and the duplicate Projects and `page_sections` collections were removed after backup.

`seed/seed.json` is the seed for a new database. Its source content and images are kept under `seed/source/`; regenerate the seed with `npm run seed:generate`, and validate it with:

```bash
npm run test:content-model
./node_modules/.bin/emdash seed seed/seed.json --validate
```

Use `npm run seed:local` only when intentionally creating a local database or adding non-conflicting seed entries; its default conflict policy skips existing content rather than overwriting it.

## Safe content-model migration

The migration script accepts only an EmDash server on `localhost`, checks the target database against the server, and writes both a JSON export and a raw SQLite backup to `/tmp` before making changes. It supports the former Blocks and intermediate Portable Text schemas. Media files are read from `seed/source/images/` or `static/images/` and uploaded into the configured EmDash uploads directory.

For a test run, copy the database and uploads first:

```bash
sqlite3 data.db ".backup '/tmp/emdash-copy.db'"
mkdir -p /tmp/emdash-copy-uploads
cp -R uploads/. /tmp/emdash-copy-uploads/
```

Start a server against that copy in Terminal 1:

```bash
DATABASE_URL=file:/tmp/emdash-copy.db EMDASH_UPLOADS_DIR=/tmp/emdash-copy-uploads ./node_modules/.bin/astro dev --host localhost --port 4173
```

Then migrate it in Terminal 2:

```bash
npm run migrate:content-model -- --url http://localhost:4173 --database /tmp/emdash-copy.db --uploads-dir /tmp/emdash-copy-uploads
```

Unpublished drafts block migration by default. Only when you explicitly accept migrating the published revision and superseding the pending draft, add `--ignore-drafts`. The raw database backup retains the original revisions and drafts. The empty `/aktuelles` placeholder is soft-deleted. Existing Projects are copied into Donations; the obsolete Projects and `page_sections` collections are then permanently removed. The raw SQLite backup retains their pre-migration records.

## Verification

With Astro already running, the admin, interaction, privacy, and public asset-link tests are read-only:

```bash
UI_BASE_URL=http://localhost:4173 npm run test:ui
VISUAL_BASE_URL=http://localhost:4173 npm run test:visual
```

Build the server bundle with `npm run build`. The visual suite compares against the frozen snapshots; its current baseline has known failures, and neither snapshots nor thresholds should be updated without review.

## Deployment

The app uses Astro's Node standalone adapter and requires a Node-compatible host with persistent storage for SQLite and uploads. GitHub Pages is static-only, so no Pages deployment is configured for this EmDash app. Choose a server host and persistent-volume strategy before deploying.
