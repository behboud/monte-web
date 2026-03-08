# Montessori Schule Gilching - Website

Static website for Montessori Schule Gilching, built with Hugo and Tailwind CSS.

## Technologie-Stack

- **Hugo Extended 0.155.1** - Static site generator
- **Tailwind CSS 4.2.1** - Utility-first CSS framework
- **Sveltia CMS** - Git-based headless CMS for content management
- **mmenu-js 9.3.0** - Mobile navigation library
- **GitHub Pages** - Static site hosting

## Installation

### Voraussetzungen

1. **Hugo Extended**: https://gohugo.io/installation/ (erfordert die extended Version für PostCSS-Support)
2. **Node.js**: Version 18 oder höher für Build-Tools

### Schritte

```bash
# Repository klonen
git clone https://github.com/behboud/monte-web.git
cd monte-web

# npm-Abhängigkeiten installieren
npm install
```

## Lokale Entwicklung

Entwicklungsserver starten:

```bash
hugo server --environment development --baseURL http://localhost:1313/
```

Der Server läuft unter http://localhost:1313 mit Live-Reload bei Dateiänderungen.

Hinweis: Für die lokale Entwicklung reicht der obige `hugo server`-Befehl; der separate Tailwind-Watch ist nicht erforderlich.

## Deployment

Das Projekt wird automatisch zu GitHub Pages deployed, wenn Änderungen auf den `main`-Branch gepusht werden.

**Deployment-Pipeline** (`.github/workflows/main.yml`):

1. Hugo Extended wird installiert (Version 0.155.1)
2. npm-Abhängigkeiten werden installiert
3. Hugo Build mit `hugo --gc --minify`
4. Statische Dateien werden zu `public/` generiert
5. Artefakt wird zu GitHub Pages deployt

**URL**: https://behboud.github.io/monte-web/

## Projektstruktur

```
monte-web/
├── assets/                  # Verarbeitete Assets (CSS, JS, Bilder)
│   ├── css/main.css        # Haupt-Stylesheet (Tailwind-Einstiegspunkt)
│   ├── js/
│   │   ├── app.js          # JS-Bundle (mmenu)
│   │   └── main.js         # Main-JS (mmenu-Initialisierung)
│   ├── plugins/            # Drittanbieter-Bibliotheken
│   └── images/             # Bilder für Templates
├── content/                # Content-Dateien (Markdown)
│   └── de/                 # Deutscher Content
│       ├── aktuelles/      # News-Bereich
│       ├── pages/          # Statische Seiten
│       ├── schule/         # Schul-Bereich
│       ├── spenden/        # Spenden-Bereich
│       └── verein/         # Verein-Bereich
├── layouts/                # Hugo-Templates
│   ├── _default/           # Standard-Templates (baseof, list, single)
│   ├── aktuelles/          # News-Templates
│   ├── spenden/            # Spenden-Templates
│   └── partials/           # Wiederverwendbare Komponenten
├── static/                 # Statische Dateien
│   ├── admin/              # Sveltia CMS
│   └── fonts/              # Benutzerdefinierte Schriften
├── hugo.toml               # Hugo-Hauptkonfiguration
├── tailwind.config.js      # Tailwind-Konfiguration
└── postcss.config.js       # PostCSS-Konfiguration
```

## Wo man was findet

### Design und Layout ändern

| Änderung          | Datei                                                          |
| ----------------- | -------------------------------------------------------------- |
| Farben, Schriften | `tailwind.config.js`                                           |
| CSS-Styles        | `assets/css/main.css`                                          |
| PostCSS-Plugins   | `postcss.config.js`                                            |
| Header-Layout     | `layouts/partials/essentials/header.html`                      |
| Footer-Layout     | `layouts/partials/essentials/footer.html`                      |
| Navigation-Menü   | `layouts/partials/essentials/menu.html`                        |
| Homepage-Layout   | `layouts/index.html`                                           |
| News-Templates    | `layouts/aktuelles/list.html`, `layouts/aktuelles/single.html` |

### Content ändern

| Content           | Datei/Ordner            |
| ----------------- | ----------------------- |
| News/Artikel      | `content/de/aktuelles/` |
| Schul-Information | `content/de/schule/`    |
| Spenden           | `content/de/spenden/`   |
| Verein            | `content/de/verein/`    |
| Statische Seiten  | `content/de/pages/`     |
| Startseite        | `content/de/_index.md`  |

### Navigation ändern

**Datei**: `hugo.toml` unter `languages.de.menus`

Menüpunkte werden hier definiert mit:

- `name`: Anzeigename
- `pageRef`: Interne Seite (z.B. `/pages/speiseplan`)
- `url`: Externe Links
- `weight`: Reihenfolge
- `params.icon`: Font Awesome Icon (z.B. `fa fa-utensils`)

Beispiel für neuen Menüpunkt:

```toml
[[languages.de.menus.top]]
name = "SPEISEPLAN"
pageRef = "/pages/speiseplan"
weight = 4
[languages.de.menus.top.params]
icon = "fa fa-utensils"
```

Icons: https://fontawesome.com/search (mit `fa-` Präfix)

### Konfiguration ändern

| Einstellung                 | Datei                                                                                                  |
| --------------------------- | ------------------------------------------------------------------------------------------------------ |
| Site-Titel, BaseURL         | `hugo.toml`                                                                                            |
| Plugins (CSS/JS)            | `hugo.toml` (`params.plugins`)                                                                         |
| Menüs                       | `hugo.toml` (`languages.de.menus`)                                                                     |
| Parameter                   | `hugo.toml` (`params`)                                                                                 |
| Sprachen                    | `hugo.toml` (`languages`)                                                                              |
| Lokaler Entwicklungs-Server | npm-Script `npm run dev` bzw. `hugo server --environment development --baseURL http://localhost:1313/` |

### Hugo-Konfigurationspolicy

- Primäre Konfigurationsquelle ist `hugo.toml`.
- Lokale Entwicklungs-Overrides werden direkt über den Startbefehl gesetzt (`--environment development --baseURL ...`).
- Nach Konfigurationsänderungen immer validieren mit:

```bash
hugo --gc --minify
npx playwright test tests/ui/style-regression.spec.ts --project=desktop-chromium --project=mobile-chromium
```

### Social Media Links

**Ort**: `content/de/pages/kontakt.md` im Frontmatter unter `social_links`.

Beispiel:

```yaml
social_links:
  - name: facebook
    icon: fab fa-facebook
    link: https://www.facebook.com/
```

## UI-Komponenten und Bibliotheken

### Designsystem

Das Frontend nutzt Tailwind Utilities plus projektinterne Komponentenklassen in `assets/css/main.css`:

- Buttons: `.btn`, `.btn-default`, `.btn-text`
- Cards: `.card`, `.card-body`, `.card-title`
- Breadcrumbs: `.breadcrumb`
- Typografie: globale Headline/Paragraph-Code Styles im `@layer base`

### Custom Farben

In `tailwind.config.js` definiert:

- `text-primary`: #121212
- `text-monte`: #222477 (Brand-Farbe)
- `bg-light`: #fcfaf7

### Custom Schriften

- `font-calligraphy`: Tangerine (für Überschriften)
- `font-sans`: Overpass (für Fließtext)

### Mobile Navigation (mmenu-js)

Hamburger-Icon triggert mobiles Menü. Konfiguration in `assets/js/main.js:48-81`.

### Galerie/Slider

Swiper-Bibliothek für Carousels. Homepage-Slideshow in `layouts/index.html`.

## Content-Management (CMS)

**Admin-Zugang**: `/admin` (nach dem Deployment)

**CMS-Konfiguration**: `static/admin/config.yml`

### Content-Editor

News-Beiträge und Seiten können über das CMS bearbeitet werden. Änderungen werden als Git-Commits gespeichert.

### Verfügbare Collections

- **aktuelles**: News-Artikel (create: true)
- **pages**: Statische Seiten (create: true)
- **schule**: Schul-Informationen (read-only)
- **spenden**: Spenden-Informationen (read-only)
- **verein**: Verein-Informationen (read-only)

## CMS-Authentifizierung (GitHub OAuth)

Das CMS nutzt **GitHub OAuth** für die Authentifizierung statt Netlify Identity. Dies ermöglicht es Benutzern, sich mit ihrem GitHub-Konto anzumelden.

### decap-proxy Cloudflare Worker

Die Authentifizierung wird über einen separaten Cloudflare Worker abgewickelt:
**Repository**: https://github.com/behboud/decap-proxy

Dieser Worker fungiert als OAuth-Proxy zwischen dem CMS und GitHub.

### Einrichtung

**Voraussetzung**: Ein Deployment von decap-proxy mit spezifischer Konfiguration.

1. **GitHub OAuth App erstellen**:
   - https://github.com/settings/applications/new
   - `Authorization callback URL`: `https://decap-proxy-domain/callback`
   - Client ID und Secret speichern

2. **Worker konfigurieren** (`wrangler.toml`):

   ```toml
   name = "decap-proxy"
   main = "src/index.ts"
   compatibility_date = "2025-11-17"
   workers_dev = false
   route = { pattern = "decap.domain.com", zone_name = "domain.com", custom_domain = true }
   ```

3. **OAuth Secrets setzen**:

   ```bash
   npx wrangler secret put GITHUB_OAUTH_ID
   npx wrangler secret put GITHUB_OAUTH_SECRET
   ```

4. **CMS-Config anpassen** (`static/admin/config.yml`):
   ```yaml
   backend:
     name: github
     repo: "behboud/monte-web"
     branch: main
     base_url: "https://decap-proxy-domain"
   ```

### Weiterführende Doku

Siehe decap-proxy README: https://github.com/behboud/decap-proxy

## Build-Pipeline

### CSS-Build

1. `assets/css/main.css` ist Einstiegspunkt
2. PostCSS verarbeitet durch:
   - `postcss-import`: @imports auflösen
   - `@tailwindcss/postcss`: Tailwind v4 Utility-Generierung

### JS-Build

1. `assets/js/app.js` importiert mmenu-js
2. esbuild (Hugo-intern) bündelt JavaScript
3. `assets/js/main.js` enthält mmenu- und Slider-Initialisierung

## UI Teststrategie (Parität)

- Playwright-basierte Visual-Regression + Interaktionstests in `tests/ui/`.
- Route-Abdeckung wird aus `public/sitemap.xml` generiert (`tests/ui/generate-routes.mjs`).
- Relevante npm-Befehle:
  - `npm run test:ui` (Build + Routen-Generierung + Playwright)
  - `npm run test:ui:update` (Snapshots aktualisieren)

### Produktions-Build

```bash
hugo --gc --minify --baseURL "https://behboud.github.io/monte-web/"
```

Erzeugt minifizierte, fingerprinted Assets mit Subresource Integrity.

## Shortcodes und Templates

### Verfügbare Partials

| Partial                          | Zweck                 |
| -------------------------------- | --------------------- |
| `components/aktuelles-card.html` | News-Card-Komponente  |
| `components/breadcrumb.html`     | Brotkrümelnavigation  |
| `components/slider.html`         | Bild-Slider           |
| `components/image-pipe.html`     | Bildverarbeitung      |
| `essentials/head.html`           | HTML-Head             |
| `essentials/header.html`         | Header mit Navigation |
| `essentials/footer.html`         | Footer                |
| `essentials/menu.html`           | Navigationsmenü       |
| `essentials/style.html`          | CSS-Laden             |
| `essentials/script.html`         | JavaScript-Laden      |

## VS Code

Empfohlene Erweiterungen in `.vscode/extensions.json`:

- Hugo-Syntax-Highlighting
- Tailwind CSS IntelliSense
- Prettier
- Markdown-All-in-One

## Lizenz

MIT
