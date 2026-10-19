# Montessori Schule Gilching - Website

Static website for Montessori Schule Gilching, built with Hugo and Tailwind CSS.

## Technologie-Stack

- **Hugo Extended 0.168.0** - Static site generator
- **Tailwind CSS 4.3.3** - Utility-first CSS framework
- **Sveltia CMS** - Git-based headless CMS for content management
- **mmenu-js 9.3.0** - Mobile navigation library
- **GitHub Pages** - Static site hosting

## Installation

### Voraussetzungen

1. **Hugo Extended**: https://gohugo.io/installation/ (erfordert die extended Version für PostCSS-Support)
2. **Node.js**: Version 22 oder höher für Build-Tools

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
npm run dev
```

Der Server läuft unter http://localhost:1313 mit Live-Reload bei Dateiänderungen. Das Dev-Script erzwingt vollständige Hugo-Neurenderings und deaktiviert HTTP-Caching, damit geänderte Templates und Styles nicht aus einem veralteten lokalen Preview kommen.

Hinweis: Für die lokale Entwicklung reicht `npm run dev`; ein separater Tailwind-Watch ist nicht erforderlich.

## Deployment

Das Projekt wird automatisch zu GitHub Pages deployed, wenn Änderungen auf den `main`-Branch gepusht werden.

**Deployment-Pipeline** (`.github/workflows/main.yml`):

1. Hugo Extended wird installiert (Version 0.168.0)
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
│       ├── spenden/        # Spenden und Förderprojekte
│       └── verein/         # Verein-Bereich
├── layouts/                # Hugo-Templates
│   ├── _default/           # Standard-Templates (baseof, list, single)
│   ├── aktuelles/          # News-Templates
│   ├── spenden/            # Spenden-Templates
│   └── partials/           # Wiederverwendbare Komponenten
├── static/                 # Statische Dateien
│   ├── admin/              # Sveltia CMS
│   ├── foerderer/          # Weiterleitung zur gemeinsamen Spendenseite
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

| Content                    | Datei/Ordner            |
| -------------------------- | ----------------------- |
| News/Artikel               | `content/de/aktuelles/` |
| Schul-Information          | `content/de/schule/`    |
| Spenden und Förderprojekte | `content/de/spenden/`   |
| Verein                     | `content/de/verein/`    |
| Footer-Seiten & Kontakt    | `content/de/pages/`     |
| Startseite                 | `content/de/_index.md`  |

Die frühere Adresse `/foerderer/` bleibt als Weiterleitung auf `/spenden/` erhalten. Förderprojekte, vergangene Unterstützungen und der zentrale Spendenaufruf sind auf der Spendenseite zusammengeführt.

### Navigation ändern

Es gibt keine separate Menükollektion. Seiten melden sich über Hugo-Frontmatter selbst in einem Menü an; die Felder **Navigation**, **Menütext**, **Menüreihenfolge** und **Menüsymbol** sind in den passenden CMS-Einträgen verfügbar.

```yaml
menus: [top] # oder [footer]
linkTitle: Speiseplan
weight: 6
menu_icon: fa fa-utensils # optional
```

Neue Seiten lassen sich in **Footer** anlegen; standardmäßig sind sie dem Footer zugeordnet. Die Zuordnung lässt sich im Eintrag ändern oder zusätzlich auf **Kopfzeile** setzen. Die CMS-Collection **Top-Menü** enthält die vorhandenen Bereichsseiten. Sie ist derzeit eine feste Liste von CMS-Dateien; eine neue Bereichsseite muss daher zuerst dort ergänzt werden. Startseite und Speiseplan liegen in eigenen Collections, sind aber ebenfalls für die Kopfzeile markiert. Kopfzeile und Burger-Menü verwenden dieselben Einträge.

Externe Links, die keine eigenen Seiten sind — etwa **Eltern-Login** und Social Media — liegen als `navigation_links` beim Kontakt-Eintrag in **Footer**. Jeder Eintrag wählt **Kopfzeile** oder **Footer**; Linktext und Ziel sind erforderlich, ein Font-Awesome-Symbol ist optional. Für interne Ziele einen Seitenpfad wie `/schule` verwenden, für externe Ziele die vollständige URL, z. B. `https://example.org`.

### Konfiguration ändern

| Einstellung                 | Datei / Ort                                                                     |
| --------------------------- | ------------------------------------------------------------------------------- |
| Site-Titel, BaseURL         | `hugo.toml`                                                                     |
| Plugins (CSS/JS)            | `hugo.toml` (`params.plugins`)                                                  |
| Seitenmenüs                 | Frontmatter der Seiten; externe Links in `content/de/pages/kontakt.md`          |
| Parameter                   | `hugo.toml` (`params`)                                                          |
| Sprachen                    | `hugo.toml` (`languages`)                                                       |
| Lokaler Entwicklungs-Server | npm-Script `npm run dev` (vollständige Neurenderings, HTTP-Caching deaktiviert) |

### Hugo-Konfigurationspolicy

- Hugo-Konfiguration und Site-Parameter werden in `hugo.toml` gepflegt; Menüzugehörigkeit und Reihenfolge stehen bei der jeweiligen Seite im Frontmatter.
- Lokale Entwicklungs-Overrides werden direkt über den Startbefehl gesetzt (`--environment development --baseURL ...`).
- Nach Konfigurationsänderungen immer validieren mit:

```bash
hugo --gc --minify
npx playwright test tests/ui/style-regression.spec.ts --project=desktop-chromium --project=mobile-chromium
```

### Zusätzliche Navigationslinks

**Ort**: `content/de/pages/kontakt.md` im Frontmatter unter `navigation_links`.

```yaml
navigation_links:
  - menu: footer
    name: Instagram
    target: https://www.instagram.com/example/
    weight: 6
    icon: fab fa-instagram
    open_in_new_tab: true
    nofollow: true
```

## UI-Komponenten und Bibliotheken

### Designsystem

Das Frontend nutzt Tailwind Utilities plus projektinterne Komponentenklassen in `assets/css/main.css`:

- Buttons: `.btn`, `.btn-default`, `.btn-text`
- Cards: `.card`, `.card-body`, `.card-title`
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

Sveltia CMS ist in `static/admin/index.html` bewusst auf Version `0.227.2` festgelegt; das JSON-Schema in `static/admin/config.yml` ist auf dieselbe Version gepinnt. So können Änderungen an der CMS-Validierung nicht ungeprüft live gehen. Bei einem Upgrade die Versionen dort ändern, die Release Notes prüfen und die CMS-Konfiguration testen.

### Content-Editor

News-Beiträge und Seiten können über das CMS bearbeitet werden. Änderungen werden als Git-Commits gespeichert. In Markdown-Feldern kann außerdem der Block **Bildreihe** eingefügt werden: bis zu acht nicht verlinkte Rundbilder mit Titel, Untertitel und optionalem Alternativtext. Die maximale Zahl der Elemente pro Reihe ist im Block einstellbar (1–4, Standard: 3). Der Editor speichert den Block als Hugo-Shortcode, sodass er auch in CMS-Markdownfeldern innerhalb von Seitenabschnitten und Spendenkarten funktioniert.

Die Sveltia-Oberfläche folgt standardmäßig der Browsersprache; Deutsch wird unterstützt. Nutzer mit einer anderen Browsersprache können in den Einstellungen unter **Sprache** Deutsch wählen. Diese Auswahl wird pro Browser gespeichert; eine projektweite Spracheinstellung bietet Sveltia nicht.

Bilder, die über das CMS hochgeladen werden, werden vor dem Speichern im Browser automatisch als WebP mit maximal 2048 × 2048 Pixeln und Qualität 82 verarbeitet. Kleinere Bilder werden nicht vergrößert; SVG-Dateien werden optimiert. Die Originaldatei wird dabei nicht in das öffentliche Repository übernommen. Hochauflösende Originale sollten separat und intern archiviert werden.

- **aktuelles**: News-Artikel (create: true)
- **pages**: Statische Seiten (create: true)
- **schule**: Schul-Informationen (read-only)
- **spenden**: Förderprojekte, frühere Unterstützungen und der zentrale Spenden-CTA
- **verein**: Verein-Informationen (read-only)

### Datenschutz und öffentliche Ressourcen

Der technische Datenschutz-Stand ist in [docs/datenschutz-umsetzung.md](docs/datenschutz-umsetzung.md) dokumentiert. Der ergänzende technische Plan steht in [docs/privacy-relaunch-plan.md](docs/privacy-relaunch-plan.md).

Die geprüften öffentlichen Seiten laden benötigte Assets lokal und setzen keine Cookies. Technische Änderungen in diesem Zusammenhang haben keine Inhalte gelöscht oder geändert. Offene Punkte sind unter anderem der Hosting-Anbieter, die Anpassung der Datenschutzerklärung und die interne Prüfung von Veröffentlichungsrechten.

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

## UI-Teststrategie

- Playwright-basierte Browser-Regressionstests und Interaktionstests in `tests/ui/`.
- Die Tests prüfen gezielt stabile Layout-Verträge wie Navigation, responsive Footer-Abstände, Seitenreihenfolge und zentrale Benutzerinteraktionen.
- Datenschutz-Regressionstests prüfen unter anderem Cookies, externe Ressourcen, Manifest/Service Worker und Browser-Speicher.
- Ein Produktions-Build-Test prüft alle internen Links und Ressourcen auf den konfigurierten Deployment-Pfad.
- Relevanter npm-Befehl:
  - `npm run test:ui` (Build + Playwright-Regressionstests)

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
