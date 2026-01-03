# Montessori Schule Gilching - Website

Static website for Montessori Schule Gilching, built with Hugo, Tailwind CSS, and Franken-UI.

## Technologie-Stack

- **Hugo Extended 0.145.0** - Static site generator
- **Tailwind CSS 3.4.17** - Utility-first CSS framework
- **Franken-UI 2.0.0** - UI component library (based on UIKit)
- **Sveltia CMS** - Git-based headless CMS for content management
- **mmenu-js 9.3.0** - Mobile navigation library
- **GitHub Pages** - Static site hosting

## Installation

### Voraussetzungen

1. **Hugo Extended**: https://gohugo.io/installation/ (erfordert die extended Version für PostCSS-Support)
2. **Node.js**: Version 16 oder höher für Build-Tools

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
hugo server
```

Der Server läuft unter http://localhost:1313 mit Live-Reload bei Dateiänderungen.

Für besseres Development-Erlebnis mit Tailwind-Watch:

```bash
# Terminal 1: Hugo Server
hugo server

# Terminal 2: Tailwind Watch (falls benötigt)
npx tailwindcss -i ./assets/css/main.css -o ./public/css/style.css --watch
```

## Deployment

Das Projekt wird automatisch zu GitHub Pages deployed, wenn Änderungen auf den `main`-Branch gepusht werden.

**Deployment-Pipeline** (`.github/workflows/main.yml`):

1. Hugo Extended wird installiert (Version 0.145.0)
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
│   │   ├── app.js          # JS-Bundle (Franken-UI, mmenu)
│   │   └── main.js         # Main-JS (mmenu-Initialisierung)
│   ├── plugins/            # Drittanbieter-Bibliotheken
│   └── images/             # Bilder für Templates
├── config/_default/        # Hugo-Konfiguration
│   ├── languages.toml      # Sprachkonfiguration
│   ├── menus.de.toml       # Navigationsmenüs
│   ├── module.toml         # Hugo-Module
│   └── params.toml         # Site-Parameter und Plugins
├── content/                # Content-Dateien (Markdown)
│   └── de/                 # Deutscher Content
│       ├── aktuelles/      # News-Bereich
│       ├── aufnahme/       # Aufnahme-Bereich
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

| Änderung | Datei |
|----------|-------|
| Farben, Schriften | `tailwind.config.js` |
| CSS-Styles | `assets/css/main.css` |
| PostCSS-Plugins | `postcss.config.js` |
| Header-Layout | `layouts/partials/essentials/header.html` |
| Footer-Layout | `layouts/partials/essentials/footer.html` |
| Navigation-Menü | `layouts/partials/essentials/menu.html` |
| Homepage-Layout | `layouts/index.html` |
| News-Templates | `layouts/aktuelles/list.html`, `layouts/aktuelles/single.html` |

### Content ändern

| Content | Datei/Ordner |
|---------|--------------|
| News/Artikel | `content/de/aktuelles/` |
| Schul-Information | `content/de/schule/` |
| Aufnahme | `content/de/aufnahme/` |
| Spenden | `content/de/spenden/` |
| Verein | `content/de/verein/` |
| Statische Seiten | `content/de/pages/` |
| Startseite | `content/de/_index.md` |

### Navigation ändern

**Datei**: `config/_default/menus.de.toml`

Menüpunkte werden hier definiert mit:
- `name`: Anzeigename
- `pageRef`: Interne Seite (z.B. `/pages/speiseplan`)
- `url`: Externe Links
- `weight`: Reihenfolge
- `params.icon`: Font Awesome Icon (z.B. `fa fa-utensils`)

Beispiel für neuen Menüpunkt:

```toml
[[top]]
name = "SPEISEPLAN"
pageRef = "/pages/speiseplan"
weight = 4
[top.params]
icon = "fa fa-utensils"
```

Icons: https://fontawesome.com/search (mit `fa-` Präfix)

### Konfiguration ändern

| Einstellung | Datei |
|-------------|-------|
| Site-Titel, BaseURL | `hugo.toml` |
| Plugins (CSS/JS) | `hugo.toml` (params.plugins) |
| Menüs | `config/_default/menus.de.toml` |
| Parameter | `config/_default/params.toml` |
| Sprachen | `config/_default/languages.toml` |

### Social Media Links

**Admin-Oberfläche**: Site Settings -> Social Media

**Oder direkt**: `data/social.json`

## UI-Komponenten und Bibliotheken

### Franken-UI (Haupt-Designsystem)

Classes beginnen mit `uk-`:
- Buttons: `uk-btn`, `uk-btn-default`, `uk-btn-text`
- Cards: `uk-card`, `uk-card-body`, `uk-card-title`
- Breadcrumbs: `uk-breadcrumb`
- Headings: `uk-h1`, `uk-h2`, `uk-h3`
- Formulare: `uk-input`, `uk-select`

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
- **aufnahme**: Aufnahme-Informationen (read-only)
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
   - `tailwindcss`: Tailwind-Classes generieren
   - `franken-ui/postcss`: CSS-Selektoren deduplizieren
   - `autoprefixer`: Vendor-Prefixes hinzufügen

### JS-Build

1. `assets/js/app.js` importiert Franken-UI und mmenu-js
2. esbuild (Hugo-intern) bündelt JavaScript
3. `assets/js/main.js` enthält mmenu-Initialisierung

### Produktions-Build

```bash
hugo --gc --minify --baseURL "https://behboud.github.io/monte-web/"
```

Erzeugt minifizierte, fingerprinted Assets mit Subresource Integrity.

## Shortcodes und Templates

### Verfügbare Partials

| Partial | Zweck |
|---------|-------|
| `components/aktuelles-card.html` | News-Card-Komponente |
| `components/breadcrumb.html` | Brotkrümelnavigation |
| `components/slider.html` | Bild-Slider |
| `components/image-pipe.html` | Bildverarbeitung |
| `essentials/head.html` | HTML-Head |
| `essentials/header.html` | Header mit Navigation |
| `essentials/footer.html` | Footer |
| `essentials/menu.html` | Navigationsmenü |
| `essentials/style.html` | CSS-Laden |
| `essentials/script.html` | JavaScript-Laden |

## VS Code

Empfohlene Erweiterungen in `.vscode/extensions.json`:
- Hugo-Syntax-Highlighting
- Tailwind CSS IntelliSense
- Prettier
- Markdown-All-in-One

##Lizenz

MIT
