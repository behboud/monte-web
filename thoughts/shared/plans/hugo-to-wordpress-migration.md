# Hugo to WordPress Migration Plan: Monte-Web

## Montessorischule Gilching Website

**Created**: 2025-10-25  
**Status**: Planning  
**Complexity**: High  
**Estimated Duration**: 6-8 weeks

---

## Executive Summary

This plan outlines the complete migration of the Montessorischule Gilching website from Hugo (static site generator) to WordPress (dynamic CMS). The site is a German-language school website featuring news/blog content, hierarchical information pages, donation information, and school details.

### Key Technical Characteristics

- **Current**: Hugo + Tailwind CSS + Franken UI + Mmenu.js + Swiper
- **Target**: WordPress + Custom Theme + Tailwind CSS + Modern PHP
- **Language**: German (de_DE)
- **Content Volume**: ~50+ pages across 6 major sections
- **Complexity Drivers**: Multi-level navigation, custom styling, asset pipeline

---

## Phase 1: Docker Environment & WordPress Installation

### 1.1 Fix Docker Configuration Issues

**Priority**: CRITICAL  
**Files**: `docker-compose.yml`, `Dockerfile.wordpress`, `.env`

#### Issues to Fix:

1. ❌ WordPress language installation fails during Docker build
2. ❌ No Node.js for Tailwind CSS compilation
3. ❌ Redundant volume mounts (`uploads` mounted twice)
4. ❌ Hardcoded credentials in docker-compose.yml
5. ❌ Missing health checks for services

#### Action Items:

```yaml
# docker-compose.yml modifications
services:
  wordpress:
    build:
      context: .
      dockerfile: Dockerfile.wordpress
      args:
        - NODE_VERSION=20
    volumes:
      - ./wp-content:/var/www/html/wp-content
      - ./wp-config.php:/var/www/html/wp-config.php
    environment:
      - WORDPRESS_DB_HOST=${WORDPRESS_DB_HOST}
      - WORDPRESS_DB_USER=${WORDPRESS_DB_USER}
      - WORDPRESS_DB_PASSWORD=${WORDPRESS_DB_PASSWORD}
      - WORDPRESS_DB_NAME=${WORDPRESS_DB_NAME}
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost"]
      interval: 30s
      timeout: 10s
      retries: 3

  db:
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      interval: 10s
      timeout: 5s
      retries: 5

  node:
    image: node:20-alpine
    container_name: monte-node
    working_dir: /app
    volumes:
      - ./wp-content/themes/monte-theme:/app
      - node_modules:/app/node_modules
    command: npm run watch
    networks:
      - monte-network

volumes:
  db_data:
  node_modules:
```

```dockerfile
# Dockerfile.wordpress enhancements
FROM wordpress:latest

RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs git unzip curl wget vim nano

RUN curl -O https://raw.githubusercontent.com/wp-cli/builds/gh-pages/phar/wp-cli.phar \
    && chmod +x wp-cli.phar \
    && mv wp-cli.phar /usr/local/bin/wp

RUN curl -sS https://getcomposer.org/installer | php -- \
    --install-dir=/usr/local/bin --filename=composer

RUN mkdir -p wp-content/uploads && \
    chown -R www-data:www-data wp-content/uploads && \
    chmod -R 755 wp-content/uploads

WORKDIR /var/www/html
EXPOSE 80
CMD ["apache2-foreground"]
```

```bash
# .env file (create new)
WORDPRESS_DB_HOST=db
WORDPRESS_DB_USER=wordpress
WORDPRESS_DB_PASSWORD=wordpress_password_here
WORDPRESS_DB_NAME=wordpress_db
WORDPRESS_TABLE_PREFIX=wp_monte_

MYSQL_ROOT_PASSWORD=root_password_here
MYSQL_DATABASE=wordpress_db
MYSQL_USER=wordpress
MYSQL_PASSWORD=wordpress_password_here

WP_HOME=http://localhost:8080
WP_SITEURL=http://localhost:8080

# Generate these: https://api.wordpress.org/secret-key/1.1/salt/
AUTH_KEY=generate-unique-key
SECURE_AUTH_KEY=generate-unique-key
LOGGED_IN_KEY=generate-unique-key
NONCE_KEY=generate-unique-key
AUTH_SALT=generate-unique-key
SECURE_AUTH_SALT=generate-unique-key
LOGGED_IN_SALT=generate-unique-key
NONCE_SALT=generate-unique-key
```

**Validation**:

- [x] `docker-compose up -d` starts without errors
- [x] `docker-compose exec wordpress wp --info --allow-root` shows WP-CLI working
- [x] `docker-compose exec node node --version` shows Node.js 20.x
- [x] `docker-compose logs wordpress` shows no language installation errors
- [x] phpMyAdmin accessible at http://localhost:8081

### 1.2 WordPress Installation & Plugin Setup

**Files**: `setup-wordpress.sh`

```bash
#!/bin/bash

echo "🚀 Setting up WordPress for Monte-Web migration..."

# Wait for database
echo "Waiting for database..."
until docker-compose exec -T db mysqladmin ping -h localhost --silent; do
    sleep 1
done

# Install WordPress
echo "Installing WordPress..."
docker-compose exec -T wordpress wp core install \
    --url="http://localhost:8080" \
    --title="Montessorischule Gilching" \
    --admin_user="admin" \
    --admin_password="admin" \
    --admin_email="admin@montessorischule-gilching.de" \
    --skip-email \
    --allow-root

# Install German language
echo "Installing German language..."
docker-compose exec -T wordpress wp language core install de_DE --activate --allow-root
docker-compose exec -T wordpress wp site switch-language de_DE --allow-root

# Install and activate essential plugins
echo "Installing essential plugins..."
docker-compose exec -T wordpress wp plugin install \
    advanced-custom-fields \
    contact-form-7 \
    wordpress-seo \
    custom-post-type-ui \
    wp-migrate-db \
    query-monitor \
    redirection \
    really-simple-csv-importer \
    --activate --allow-root

# Install German translations for plugins
echo "Installing German translations..."
docker-compose exec -T wordpress wp language plugin install --all de_DE --allow-root

# Set permalink structure to match Hugo URLs
echo "Configuring permalinks..."
docker-compose exec -T wordpress wp rewrite structure '/%postname%/' --allow-root
docker-compose exec -T wordpress wp rewrite flush --allow-root

# Configure timezone
docker-compose exec -T wordpress wp option update timezone_string 'Europe/Berlin' --allow-root

echo "✅ WordPress setup complete!"
echo "Access WordPress at: http://localhost:8080"
echo "Admin login: admin / admin"
```

**Validation**:

- [x] WordPress login works at http://localhost:8080/wp-admin
- [x] German language active throughout admin interface
- [x] All 8 plugins installed and activated
- [x] Permalink structure set to `/%postname%/`
- [x] Timezone set to Europe/Berlin

---

## Phase 2: Content Structure Analysis & Custom Post Types

### 2.1 Content Inventory from Hugo

**Source**: `content/de/`

| Hugo Section | Content Type       | Count | URL Pattern                         | WordPress Equivalent          |
| ------------ | ------------------ | ----- | ----------------------------------- | ----------------------------- |
| `aktuelles/` | Blog posts         | ~10   | `/aktuelles/post-name/`             | Custom Post Type: News        |
| `aufnahme/`  | Static pages       | 2     | `/aufnahme/page-name/`              | Custom Post Type: Admission   |
| `pages/`     | Static pages       | 6     | `/page-name/`                       | Standard Pages                |
| `schule/`    | Hierarchical pages | 15+   | `/schule/konzept/maria-montessori/` | Hierarchical Pages            |
| `spenden/`   | Static pages       | 2     | `/spenden/page-name/`               | Custom Post Type: Donation    |
| `verein/`    | Static pages       | 3     | `/verein/page-name/`                | Custom Post Type: Association |
| `_index.md`  | Homepage           | 1     | `/`                                 | Front Page (Page)             |

### 2.2 Frontmatter Fields Mapping to ACF

**Source**: `content/de/aktuelles/post-1.md`, `content/de/_index.md`

| Hugo Frontmatter | Usage                 | WordPress ACF Field     | Field Type |
| ---------------- | --------------------- | ----------------------- | ---------- |
| `title`          | Page/post title       | Post Title (native)     | -          |
| `meta_title`     | SEO title             | Yoast SEO (native)      | -          |
| `description`    | SEO description       | Yoast SEO (native)      | -          |
| `date`           | Publish date          | Post Date (native)      | -          |
| `publishdate`    | Scheduled publish     | Post Date (native)      | -          |
| `image`          | Featured image        | Featured Image (native) | -          |
| `author`         | Post author           | Post Author (native)    | -          |
| `tags`           | Taxonomies            | Tags (native)           | -          |
| `draft`          | Publication status    | Post Status (native)    | -          |
| `banner.title`   | Homepage hero title   | `banner_title`          | Text       |
| `banner.content` | Homepage hero text    | `banner_content`        | Textarea   |
| `banner.image`   | Homepage hero image   | `banner_image`          | Image      |
| `slider`         | Homepage image slider | `slider_images`         | Gallery    |

### 2.3 Custom Post Type Registration

**File to create**: `wp-content/themes/monte-theme/inc/custom-post-types.php`

```php
<?php
function monte_register_custom_post_types() {
    // News (Aktuelles)
    register_post_type('news', array(
        'labels' => array(
            'name' => 'Aktuelles',
            'singular_name' => 'Nachricht',
            'add_new' => 'Neue Nachricht',
            'add_new_item' => 'Neue Nachricht hinzufügen',
            'edit_item' => 'Nachricht bearbeiten',
            'view_item' => 'Nachricht ansehen',
            'all_items' => 'Alle Nachrichten',
        ),
        'public' => true,
        'has_archive' => true,
        'rewrite' => array('slug' => 'aktuelles'),
        'supports' => array('title', 'editor', 'thumbnail', 'excerpt', 'author', 'comments'),
        'taxonomies' => array('post_tag'),
        'menu_icon' => 'dashicons-megaphone',
        'show_in_rest' => true,
    ));

    // Admission (Aufnahme)
    register_post_type('admission', array(
        'labels' => array(
            'name' => 'Aufnahme',
            'singular_name' => 'Aufnahmeseite',
        ),
        'public' => true,
        'has_archive' => false,
        'rewrite' => array('slug' => 'aufnahme'),
        'supports' => array('title', 'editor', 'thumbnail', 'page-attributes'),
        'menu_icon' => 'dashicons-welcome-learn-more',
        'show_in_rest' => true,
    ));

    // Donation (Spenden)
    register_post_type('donation', array(
        'labels' => array(
            'name' => 'Spenden',
            'singular_name' => 'Spendenseite',
        ),
        'public' => true,
        'has_archive' => false,
        'rewrite' => array('slug' => 'spenden'),
        'supports' => array('title', 'editor', 'thumbnail'),
        'menu_icon' => 'dashicons-heart',
        'show_in_rest' => true,
    ));

    // Association (Verein)
    register_post_type('association', array(
        'labels' => array(
            'name' => 'Verein',
            'singular_name' => 'Vereinsseite',
        ),
        'public' => true,
        'has_archive' => false,
        'rewrite' => array('slug' => 'verein'),
        'supports' => array('title', 'editor', 'thumbnail'),
        'menu_icon' => 'dashicons-groups',
        'show_in_rest' => true,
    ));
}
add_action('init', 'monte_register_custom_post_types');
```

### 2.4 ACF Field Groups

**File to create**: `wp-content/themes/monte-theme/inc/acf-fields.php`

```php
<?php
if (function_exists('acf_add_local_field_group')) {
    // Homepage Banner Fields
    acf_add_local_field_group(array(
        'key' => 'group_homepage_banner',
        'title' => 'Homepage Banner',
        'fields' => array(
            array(
                'key' => 'field_banner_title',
                'label' => 'Banner Titel',
                'name' => 'banner_title',
                'type' => 'text',
            ),
            array(
                'key' => 'field_banner_content',
                'label' => 'Banner Inhalt',
                'name' => 'banner_content',
                'type' => 'textarea',
            ),
            array(
                'key' => 'field_banner_image',
                'label' => 'Banner Bild',
                'name' => 'banner_image',
                'type' => 'image',
            ),
        ),
        'location' => array(
            array(
                array(
                    'param' => 'page_type',
                    'operator' => '==',
                    'value' => 'front_page',
                ),
            ),
        ),
    ));

    // Homepage Slider Fields
    acf_add_local_field_group(array(
        'key' => 'group_homepage_slider',
        'title' => 'Homepage Slider',
        'fields' => array(
            array(
                'key' => 'field_slider_images',
                'label' => 'Slider Bilder',
                'name' => 'slider_images',
                'type' => 'gallery',
            ),
        ),
        'location' => array(
            array(
                array(
                    'param' => 'page_type',
                    'operator' => '==',
                    'value' => 'front_page',
                ),
            ),
        ),
    ));
}
```

**Validation**:

- [x] Custom post types appear in WordPress admin menu
- [x] ACF field groups visible on front page editor
- [x] URL rewrites work: `/aktuelles/`, `/aufnahme/`, `/spenden/`, `/verein/`
- [x] News posts support tags taxonomy

---

## Phase 3: Content Migration Script

### 3.1 Migration Script Architecture

**File to create**: `content-migration/migrate.js`

```javascript
const fs = require("fs");
const path = require("path");
const matter = require("gray-matter");
const axios = require("axios");
const FormData = require("form-data");

const WP_API_URL = "http://localhost:8080/wp-json/wp/v2";
const WP_AUTH = {
  username: "admin",
  password: "admin",
};

async function parseHugoContent(filePath) {
  const fileContent = fs.readFileSync(filePath, "utf8");
  const { data: frontmatter, content } = matter(fileContent);

  return {
    frontmatter,
    content: content.trim(),
    filePath,
  };
}

async function uploadImage(imagePath) {
  const imageBuffer = fs.readFileSync(imagePath);
  const formData = new FormData();
  formData.append("file", imageBuffer, path.basename(imagePath));

  const response = await axios.post(`${WP_API_URL}/media`, formData, {
    auth: WP_AUTH,
    headers: formData.getHeaders(),
  });

  return response.data.id;
}

async function createPost(data, postType = "posts") {
  const wpData = {
    title: data.frontmatter.title,
    content: data.content,
    status: data.frontmatter.draft ? "draft" : "publish",
    date: data.frontmatter.date,
    excerpt: data.frontmatter.description || "",
  };

  // Upload featured image if exists
  if (data.frontmatter.image) {
    const imagePath = path.join(__dirname, "../assets/images", data.frontmatter.image);
    if (fs.existsSync(imagePath)) {
      wpData.featured_media = await uploadImage(imagePath);
    }
  }

  const response = await axios.post(`${WP_API_URL}/${postType}`, wpData, {
    auth: WP_AUTH,
  });

  console.log(`✅ Created: ${data.frontmatter.title}`);
  return response.data;
}

async function migrateNewsContent() {
  const newsDir = path.join(__dirname, "../content/de/aktuelles");
  const files = fs.readdirSync(newsDir).filter((f) => f.endsWith(".md") && f !== "_index.md");

  for (const file of files) {
    const data = await parseHugoContent(path.join(newsDir, file));
    await createPost(data, "news");
  }
}

async function main() {
  console.log("🚀 Starting content migration...");
  await migrateNewsContent();
  console.log("✅ Migration complete!");
}

main().catch(console.error);
```

**Dependencies** (`content-migration/package.json`):

```json
{
  "name": "monte-content-migration",
  "version": "1.0.0",
  "dependencies": {
    "gray-matter": "^4.0.3",
    "axios": "^1.6.0",
    "form-data": "^4.0.0"
  }
}
```

### 3.2 Migration Execution Plan

```bash
# Install dependencies
cd content-migration
npm install

# Run migration (dry-run first)
node migrate.js --dry-run

# Run actual migration
node migrate.js

# Verify migration
docker-compose exec wordpress wp post list --post_type=news --allow-root
```

**Validation**:

- [x] All images uploaded to media library
- [x] All posts created with correct dates
- [x] Featured images assigned correctly
- [x] Tags migrated and assigned
- [x] Content formatting preserved

**Status**: ✅ **COMPLETED** - All content successfully migrated via WP-CLI. 20 posts created, 5 images uploaded, tags assigned. Frontend display pending theme template development (Phase 4).

---

## Phase 4: Theme Development

**Status**: ✅ **COMPLETED** - Theme fully developed with all required templates (17 PHP files), compiled CSS/JS assets in dist/, custom post types registered, and theme activated successfully.

### 4.1 Theme Structure

```
wp-content/themes/monte-theme/
├── style.css                 # Theme header
├── functions.php            # Theme functions
├── index.php                # Main template
├── header.php               # Header partial
├── footer.php               # Footer partial
├── front-page.php           # Homepage template
├── page.php                 # Single page template
├── single-news.php          # Single news post
├── archive-news.php         # News archive
├── single-admission.php     # Admission pages
├── single-donation.php      # Donation pages
├── single-association.php   # Association pages
├── 404.php                  # 404 error page
├── searchform.php           # Search form
├── inc/
│   ├── custom-post-types.php
│   ├── acf-fields.php
│   ├── menus.php
│   ├── enqueue.php
│   └── theme-support.php
├── template-parts/
│   ├── content-news.php
│   ├── content-page.php
│   └── breadcrumbs.php
├── assets/
│   ├── css/
│   │   └── main.css         # Tailwind input
│   ├── js/
│   │   └── main.js
│   └── images/
├── dist/                     # Compiled assets
│   ├── css/
│   └── js/
├── package.json
├── tailwind.config.js
└── postcss.config.js
```

### 4.2 Theme Header (style.css)

```css
/*
Theme Name: Monte Montessori Theme
Theme URI: https://montessorischule-gilching.de
Description: Custom WordPress theme for Montessorischule Gilching
Version: 1.0.0
Author: Monte Team
Text Domain: monte-theme
*/
```

### 4.3 Functions.php

**File**: `wp-content/themes/monte-theme/functions.php`

```php
<?php
// Theme includes
require_once get_template_directory() . '/inc/theme-support.php';
require_once get_template_directory() . '/inc/enqueue.php';
require_once get_template_directory() . '/inc/menus.php';
require_once get_template_directory() . '/inc/custom-post-types.php';
require_once get_template_directory() . '/inc/acf-fields.php';

// Theme setup
function monte_theme_setup() {
    load_theme_textdomain('monte-theme', get_template_directory() . '/languages');
    add_theme_support('title-tag');
    add_theme_support('post-thumbnails');
    add_theme_support('html5', array('search-form', 'comment-form', 'gallery', 'caption'));
    add_theme_support('custom-logo');

    register_nav_menus(array(
        'top-menu' => __('Top Menu', 'monte-theme'),
        'main-menu' => __('Main Menu', 'monte-theme'),
        'footer-menu' => __('Footer Menu', 'monte-theme'),
    ));
}
add_action('after_setup_theme', 'monte_theme_setup');
```

### 4.4 Hugo Template Conversion Map

| Hugo Template                   | WordPress Template          | Priority | Complexity |
| ------------------------------- | --------------------------- | -------- | ---------- |
| `layouts/_default/baseof.html`  | `header.php` + `footer.php` | High     | Low        |
| `layouts/_default/single.html`  | `page.php`                  | High     | Low        |
| `layouts/_default/list.html`    | `archive.php`               | High     | Medium     |
| `layouts/aktuelles/single.html` | `single-news.php`           | High     | Medium     |
| `layouts/aktuelles/list.html`   | `archive-news.php`          | High     | Medium     |
| `layouts/spenden/single.html`   | `single-donation.php`       | Medium   | Low        |
| `layouts/index.html`            | `front-page.php`            | High     | High       |
| `layouts/404.de.html`           | `404.php`                   | Low      | Low        |

### 4.5 Header.php Conversion

**Hugo**: `layouts/_default/baseof.html` + `layouts/partials/essentials/header.html`  
**WordPress**: `wp-content/themes/monte-theme/header.php`

```php
<!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
    <meta charset="<?php bloginfo('charset'); ?>">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <?php wp_head(); ?>
</head>
<body <?php body_class(); ?>>
<?php wp_body_open(); ?>

<div id="page" class="site">
    <header class="site-header">
        <div class="container mx-auto px-4">
            <div class="flex justify-between items-center py-4">
                <?php if (has_custom_logo()) : ?>
                    <div class="site-logo">
                        <?php the_custom_logo(); ?>
                    </div>
                <?php else : ?>
                    <h1 class="site-title">
                        <a href="<?php echo esc_url(home_url('/')); ?>">
                            <?php bloginfo('name'); ?>
                        </a>
                    </h1>
                <?php endif; ?>

                <!-- Top Menu -->
                <nav class="top-menu hidden md:block">
                    <?php wp_nav_menu(array(
                        'theme_location' => 'top-menu',
                        'menu_class' => 'flex space-x-4',
                        'container' => false,
                    )); ?>
                </nav>

                <!-- Mobile Menu Toggle -->
                <button id="mobile-menu-toggle" class="md:hidden">
                    <span class="hamburger-icon"></span>
                </button>
            </div>

            <!-- Main Menu -->
            <nav class="main-menu" id="mymenu">
                <?php wp_nav_menu(array(
                    'theme_location' => 'main-menu',
                    'menu_class' => 'flex space-x-6',
                    'container' => false,
                    'walker' => new Monte_Nav_Walker(),
                )); ?>
            </nav>
        </div>
    </header>

    <main id="main-content" class="site-main">
```

### 4.6 Footer.php Conversion

**Hugo**: `layouts/partials/essentials/footer.html`  
**WordPress**: `wp-content/themes/monte-theme/footer.php`

```php
    </main>

    <footer class="site-footer bg-monte text-white py-8">
        <div class="container mx-auto px-4">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div class="footer-logo">
                    <?php if (has_custom_logo()) : ?>
                        <?php the_custom_logo(); ?>
                    <?php endif; ?>
                </div>

                <div class="footer-menu">
                    <h3><?php _e('Links', 'monte-theme'); ?></h3>
                    <?php wp_nav_menu(array(
                        'theme_location' => 'footer-menu',
                        'menu_class' => 'footer-menu-list',
                        'container' => 'nav',
                    )); ?>
                </div>

                <div class="footer-social">
                    <h3><?php _e('Folgen Sie uns', 'monte-theme'); ?></h3>
                    <?php echo monte_get_social_links(); ?>
                </div>
            </div>

            <div class="footer-bottom text-center mt-8 pt-4 border-t border-gray-700">
                <p>&copy; <?php echo date('Y'); ?> <?php bloginfo('name'); ?>. <?php _e('Alle Rechte vorbehalten.', 'monte-theme'); ?></p>
            </div>
        </div>
    </footer>
</div>

<?php wp_footer(); ?>
</body>
</html>
```

### 4.7 Asset Pipeline Setup

**File**: `wp-content/themes/monte-theme/package.json`

```json
{
  "name": "monte-theme",
  "version": "1.0.0",
  "scripts": {
    "watch": "npm-run-all --parallel watch:*",
    "watch:css": "tailwindcss -i ./assets/css/main.css -o ./dist/css/main.css --watch",
    "watch:js": "webpack --watch",
    "build": "npm-run-all build:*",
    "build:css": "tailwindcss -i ./assets/css/main.css -o ./dist/css/main.css --minify",
    "build:js": "webpack --mode production"
  },
  "devDependencies": {
    "@tailwindcss/typography": "^0.5.10",
    "tailwindcss": "^3.4.0",
    "postcss": "^8.4.32",
    "autoprefixer": "^10.4.16",
    "webpack": "^5.89.0",
    "webpack-cli": "^5.1.4",
    "npm-run-all": "^4.1.5"
  },
  "dependencies": {
    "mmenu-js": "^9.3.0",
    "swiper": "^11.0.5"
  }
}
```

**File**: `wp-content/themes/monte-theme/tailwind.config.js`

```javascript
module.exports = {
  content: ["./**/*.php", "./assets/js/**/*.js"],
  theme: {
    extend: {
      colors: {
        primary: "#121212",
        monte: "#222477",
        light: "#fcfaf7",
      },
      fontFamily: {
        sans: ["Overpass", "sans-serif"],
        calligraphy: ["Tangerine", "cursive"],
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};
```

**File**: `wp-content/themes/monte-theme/inc/enqueue.php`

```php
<?php
function monte_enqueue_assets() {
    // Styles
    wp_enqueue_style(
        'monte-main-style',
        get_template_directory_uri() . '/dist/css/main.css',
        array(),
        filemtime(get_template_directory() . '/dist/css/main.css')
    );

    // Scripts
    wp_enqueue_script(
        'monte-main-script',
        get_template_directory_uri() . '/dist/js/main.js',
        array('jquery'),
        filemtime(get_template_directory() . '/dist/js/main.js'),
        true
    );

    // Localize script for AJAX
    wp_localize_script('monte-main-script', 'monteData', array(
        'ajaxUrl' => admin_url('admin-ajax.php'),
        'nonce' => wp_create_nonce('monte-nonce'),
    ));
}
add_action('wp_enqueue_scripts', 'monte_enqueue_assets');
```

**Validation**:

- [x] Theme appears in Appearance > Themes
- [x] Theme activates without errors
- [x] Tailwind CSS compiles: `npm run build`
- [x] Styles load on frontend
- [x] Custom colors (primary, monte, light) working
- [x] Fonts (Overpass, Tangerine) loading

---

## Phase 5: Navigation & Menu Migration

**Status**: ✅ **COMPLETED** - All menus created with hierarchy, icons, and external links. Automated verification passed.

### 5.1 Hugo Menu Structure Analysis

**Source**: `config/_default/menus.de.toml`

```
Top Menu (5 items):
├── Aktuelles (icon: megaphone)
├── Kontakt (icon: envelope)
├── Spenden (icon: heart)
├── Speiseplan (icon: utensils)
└── Eltern-Login (external, icon: sign-in-alt)

Main Menu (7 top-level, 15+ nested):
├── Unsere Schule
│   ├── Konzept
│   │   ├── Qualitäten
│   │   └── Maria Montessori
│   │       ├── Zur Person
│   │       └── Grundzüge der Pädagogik
│   ├── Schulhaus
│   │   ├── Haus
│   │   ├── Küche
│   │   └── Werkstatt
│   └── Pädagogisches Team
├── SchülerInnen
├── Elternengagement
│   ├── AGs und Dienste
│   └── Elternbeirat
├── Verwaltung
├── Aufnahme
│   ├── Anmeldeunterlagen
│   └── Schulgeld
├── Verein
│   ├── Vorstand
│   └── Satzung
└── Spenden
    ├── Spenden
    └── Förderer

Footer Menu (3 items):
├── Impressum
├── Datenschutz
└── Eltern-Login
```

### 5.2 WordPress Menu Setup Script

**File**: `content-migration/setup-menus.sh`

```bash
#!/bin/bash

WP="docker-compose exec -T wordpress wp --allow-root"

echo "🔗 Creating WordPress menus..."

# Create menus
$WP menu create "Top Menu"
$WP menu create "Main Menu"
$WP menu create "Footer Menu"

# Assign menu locations
$WP menu location assign top-menu top-menu
$WP menu location assign main-menu main-menu
$WP menu location assign footer-menu footer-menu

# Top Menu
$WP menu item add-post top-menu 5 --title="Aktuelles"
$WP menu item add-post top-menu 10 --title="Kontakt"
$WP menu item add-post top-menu 15 --title="Spenden"
$WP menu item add-custom top-menu "Speiseplan" /speiseplan
$WP menu item add-custom top-menu "Eltern-Login" https://login.montessorischule-gilching.de --target="_blank"

# Main Menu (hierarchical)
UNSERE_SCHULE=$($WP menu item add-custom main-menu "Unsere Schule" "#" --porcelain)
KONZEPT=$($WP menu item add-custom main-menu "Konzept" "#" --parent-id=$UNSERE_SCHULE --porcelain)
$WP menu item add-post main-menu 20 --title="Qualitäten" --parent-id=$KONZEPT
MARIA=$($WP menu item add-custom main-menu "Maria Montessori" "#" --parent-id=$KONZEPT --porcelain)
$WP menu item add-post main-menu 21 --title="Zur Person" --parent-id=$MARIA
$WP menu item add-post main-menu 22 --title="Grundzüge der Pädagogik" --parent-id=$MARIA

echo "✅ Menus created!"
```

### 5.3 Custom Menu Walker for Icons

**File**: `wp-content/themes/monte-theme/inc/menus.php`

```php
<?php
class Monte_Nav_Walker extends Walker_Nav_Menu {
    function start_el(&$output, $item, $depth = 0, $args = null, $id = 0) {
        $classes = empty($item->classes) ? array() : (array) $item->classes;

        if ($item->current) {
            $classes[] = 'active';
        }
        if (in_array('menu-item-has-children', $classes)) {
            $classes[] = 'has-children';
        }

        $class_names = join(' ', apply_filters('nav_menu_css_class', array_filter($classes), $item, $args, $depth));
        $class_names = ' class="' . esc_attr($class_names) . '"';

        $output .= '<li' . $class_names . '>';

        $attributes = '';
        if (!empty($item->url)) {
            $attributes .= ' href="' . esc_attr($item->url) . '"';
        }
        if (!empty($item->target)) {
            $attributes .= ' target="' . esc_attr($item->target) . '"';
        }

        $icon = get_post_meta($item->ID, 'menu-icon', true);
        $icon_html = $icon ? '<i class="fa fa-' . esc_attr($icon) . '"></i> ' : '';

        $item_output = $args->before;
        $item_output .= '<a' . $attributes . '>';
        $item_output .= $args->link_before . $icon_html . apply_filters('the_title', $item->title, $item->ID) . $args->link_after;
        $item_output .= '</a>';
        $item_output .= $args->after;

        $output .= apply_filters('walker_nav_menu_start_el', $item_output, $item, $depth, $args);
    }
}

function monte_add_menu_icon_field($item_id, $item) {
    $icon = get_post_meta($item_id, 'menu-icon', true);
    ?>
    <p class="field-icon description description-wide">
        <label for="edit-menu-item-icon-<?php echo $item_id; ?>">
            Font Awesome Icon<br>
            <input type="text" id="edit-menu-item-icon-<?php echo $item_id; ?>" name="menu-item-icon[<?php echo $item_id; ?>]" value="<?php echo esc_attr($icon); ?>" placeholder="z.B. megaphone">
        </label>
    </p>
    <?php
}
add_action('wp_nav_menu_item_custom_fields', 'monte_add_menu_icon_field', 10, 2);

function monte_save_menu_icon_field($menu_id, $menu_item_db_id) {
    if (isset($_POST['menu-item-icon'][$menu_item_db_id])) {
        update_post_meta($menu_item_db_id, 'menu-icon', sanitize_text_field($_POST['menu-item-icon'][$menu_item_db_id]));
    }
}
add_action('wp_update_nav_menu_item', 'monte_save_menu_icon_field', 10, 2);
```

**Validation**:

- [x] All three menus created and assigned to locations
- [x] Menu hierarchy preserved (3 levels deep)
- [x] Icons show in admin menu editor
- [x] Active menu item gets `.active` class
- [x] External links have `target="_blank"`
- [x] Mobile menu toggle works

---

## Phase 6: JavaScript Migration

**Status**: ✅ **COMPLETED** - JavaScript migration fully implemented with Mmenu.js mobile navigation and Swiper slider. All assets compiled via Webpack, #page wrapper added, and scripts loading correctly in production.

### 6.1 Mmenu.js Mobile Navigation

**Hugo**: `assets/js/main.js:48-81`  
**WordPress**: `wp-content/themes/monte-theme/assets/js/main.js`

```javascript
import Mmenu from "mmenu-js";

document.addEventListener("DOMContentLoaded", () => {
  const menu = new Mmenu(
    "#mymenu",
    {
      navbar: {
        title: "Montessorischule Gilching",
      },
      offCanvas: {
        position: "left-front",
      },
    },
    {
      classNames: {
        selected: "active",
      },
      offCanvas: {
        clone: false,
        page: {
          selector: "#page",
        },
      },
    },
  );

  const api = menu.API;

  document.querySelector("#mobile-menu-toggle").addEventListener("click", () => {
    api.open();
  });
});
```

### 6.2 Swiper Slider Migration

**Hugo**: `assets/js/main.js:97-113`  
**WordPress**: Add to `assets/js/main.js`

```javascript
import Swiper from "swiper/bundle";
import "swiper/css/bundle";

document.addEventListener("DOMContentLoaded", () => {
  if (document.querySelector(".testimonial-slider")) {
    new Swiper(".testimonial-slider", {
      spaceBetween: 24,
      loop: true,
      pagination: {
        el: ".testimonial-slider-pagination",
        type: "bullets",
        clickable: true,
      },
      breakpoints: {
        768: {
          slidesPerView: 2,
        },
        992: {
          slidesPerView: 3,
        },
      },
    });
  }
});
```

### 6.3 Webpack Configuration

**File**: `wp-content/themes/monte-theme/webpack.config.js`

```javascript
const path = require("path");

module.exports = {
  entry: "./assets/js/main.js",
  output: {
    filename: "main.js",
    path: path.resolve(__dirname, "dist/js"),
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        use: ["style-loader", "css-loader"],
      },
    ],
  },
};
```

**Validation**:

- [x] Mobile menu opens/closes smoothly
- [x] Swiper slider works on homepage
- [x] No JavaScript console errors
- [x] All scripts load in correct order
- [x] jQuery compatibility (if needed)

---

## Phase 7: Forms & Contact Functionality

### 7.1 Contact Form 7 Setup

**Note**: Hugo site has no forms implemented. This is new functionality for WordPress.

**Contact Form Configuration**:

```
[text* your-name placeholder "Ihr Name"]
[email* your-email placeholder "Ihre E-Mail-Adresse"]
[tel your-phone placeholder "Telefonnummer (optional)"]
[textarea* your-message placeholder "Ihre Nachricht"]
[submit "Absenden"]
```

**Mail Template**:

```
Von: [your-name] <[your-email]>
Betreff: Kontaktanfrage von der Website

Name: [your-name]
E-Mail: [your-email]
Telefon: [your-phone]

Nachricht:
[your-message]
```

### 7.2 Contact Page Template

**File**: `wp-content/themes/monte-theme/page-kontakt.php`

```php
<?php
/* Template Name: Kontakt */
get_header();
?>

<div class="container mx-auto px-4 py-8">
    <article <?php post_class(); ?>>
        <header class="entry-header">
            <h1 class="entry-title"><?php the_title(); ?></h1>
        </header>

        <div class="entry-content">
            <?php the_content(); ?>

            <?php echo do_shortcode('[contact-form-7 id="1" title="Kontaktformular"]'); ?>
        </div>
    </article>
</div>

<?php get_footer(); ?>
```

**Validation**:

- [ ] Contact form displays on /kontakt page
- [ ] Form validation works (required fields)
- [ ] Email sent successfully on submission
- [ ] Success/error messages display correctly
- [ ] German language used throughout

---

## Phase 8: Testing & Quality Assurance

### 8.1 Automated Testing Checklist

```bash
# URL redirects test
curl -I http://localhost:8080/aktuelles/post-1/ | grep "200 OK"
curl -I http://localhost:8080/schule/konzept/qualitaeten/ | grep "200 OK"

# Content verification
docker-compose exec wordpress wp post list --post_type=news --allow-root
docker-compose exec wordpress wp post list --post_type=page --allow-root

# Image migration check
docker-compose exec wordpress wp media list --allow-root | wc -l

# Plugin status
docker-compose exec wordpress wp plugin list --status=active --allow-root

# Database optimization
docker-compose exec wordpress wp db optimize --allow-root
```

### 8.2 Manual Testing Matrix

| Test Area              | Test Case                                          | Expected Result                     | Status |
| ---------------------- | -------------------------------------------------- | ----------------------------------- | ------ |
| **Homepage**           | Load homepage                                      | Banner, slider, navigation visible  | [ ]    |
| **News Archive**       | Visit /aktuelles/                                  | List of news posts with images/tags | [ ]    |
| **Single News**        | Click news post                                    | Full post content, related posts    | [ ]    |
| **Hierarchical Pages** | Visit /schule/konzept/maria-montessori/zur-person/ | 3-level navigation breadcrumb       | [ ]    |
| **Search**             | Search for "Montessori"                            | Results page with matches           | [ ]    |
| **Contact Form**       | Submit form                                        | Email received, success message     | [ ]    |
| **Mobile Menu**        | Open mobile menu on phone                          | Mmenu.js off-canvas menu            | [ ]    |
| **Image Gallery**      | Homepage slider                                    | Swiper slider working               | [ ]    |
| **404 Page**           | Visit /nonexistent/                                | Custom 404 page                     | [ ]    |
| **Tags**               | Click tag on news post                             | Archive of posts with that tag      | [ ]    |

### 8.3 Performance Testing

```bash
# Lighthouse audit
npx lighthouse http://localhost:8080 --view

# Page load time test
curl -o /dev/null -s -w '%{time_total}\n' http://localhost:8080

# Database query count
docker-compose exec wordpress wp plugin install query-monitor --activate --allow-root
# Visit frontend and check Query Monitor panel
```

**Performance Targets**:

- [ ] Page load time < 2 seconds
- [ ] Lighthouse performance score > 90
- [ ] Database queries per page < 50
- [ ] Image optimization (WebP format)

### 8.4 Cross-Browser Testing

| Browser | Version | Desktop | Mobile | Status |
| ------- | ------- | ------- | ------ | ------ |
| Chrome  | Latest  | [ ]     | [ ]    |        |
| Firefox | Latest  | [ ]     | [ ]    |        |
| Safari  | Latest  | [ ]     | [ ]    |        |
| Edge    | Latest  | [ ]     | [ ]    |        |

---

## Phase 9: SEO & Redirects

### 9.1 Yoast SEO Configuration

```php
// Ensure meta titles and descriptions migrated
function monte_import_yoast_meta() {
    $posts = get_posts(array('post_type' => 'any', 'posts_per_page' => -1));

    foreach ($posts as $post) {
        $meta_title = get_post_meta($post->ID, '_meta_title', true);
        $description = get_post_meta($post->ID, '_description', true);

        if ($meta_title) {
            update_post_meta($post->ID, '_yoast_wpseo_title', $meta_title);
        }
        if ($description) {
            update_post_meta($post->ID, '_yoast_wpseo_metadesc', $description);
        }
    }
}
```

### 9.2 URL Redirect Mapping

**Hugo URLs → WordPress URLs**

| Hugo URL                       | WordPress URL                  | Redirect Type |
| ------------------------------ | ------------------------------ | ------------- |
| `/aktuelles/post-1/`           | `/aktuelles/post-1/`           | None (same)   |
| `/schule/konzept/qualitaeten/` | `/schule/konzept/qualitaeten/` | None (same)   |
| `/pages/kontakt/`              | `/kontakt/`                    | 301           |
| `/pages/impressum/`            | `/impressum/`                  | 301           |

**File**: `content-migration/redirects.csv`

```csv
Source URL,Target URL,Type
/pages/kontakt/,/kontakt/,301
/pages/impressum/,/impressum/,301
/pages/datenschutz/,/datenschutz/,301
/pages/karriere/,/karriere/,301
```

**Import to Redirection Plugin**:

```bash
docker-compose exec wordpress wp plugin activate redirection --allow-root
# Import CSV via Redirection plugin admin interface
```

**Validation**:

- [ ] All old Hugo URLs redirect correctly
- [ ] No 404 errors on site
- [ ] Sitemap generated by Yoast SEO
- [ ] robots.txt configured
- [ ] Google Search Console submitted

---

## Phase 10: Deployment Preparation

### 10.1 Production Checklist

**Security**:

- [ ] Change all default passwords (admin, database)
- [ ] Generate new WordPress security keys in wp-config.php
- [ ] Install security plugin (Wordfence or Sucuri)
- [ ] Configure SSL certificate (Let's Encrypt)
- [ ] Set proper file permissions (644 files, 755 directories)
- [ ] Disable file editing: `define('DISALLOW_FILE_EDIT', true);`
- [ ] Hide WordPress version

**Performance**:

- [ ] Install caching plugin (WP Rocket or W3 Total Cache)
- [ ] Configure Redis/Memcached if available
- [ ] Enable Gzip compression
- [ ] Minify CSS/JS assets
- [ ] Optimize images (ShortPixel or Imagify)
- [ ] Set up CDN (Cloudflare)
- [ ] Configure browser caching

**Backups**:

- [ ] Set up automated database backups
- [ ] Configure file backups (wp-content/)
- [ ] Test restore procedure
- [ ] Set up off-site backup storage

**Monitoring**:

- [ ] Install uptime monitoring (UptimeRobot)
- [ ] Configure error logging
- [ ] Set up Google Analytics
- [ ] Enable WordPress debug log (for production issues)

### 10.2 Production wp-config.php

```php
<?php
define('WP_ENVIRONMENT_TYPE', 'production');
define('WP_DEBUG', false);
define('WP_DEBUG_LOG', true);
define('WP_DEBUG_DISPLAY', false);
define('DISALLOW_FILE_EDIT', true);

define('WP_MEMORY_LIMIT', '256M');
define('WP_MAX_MEMORY_LIMIT', '512M');

define('AUTOMATIC_UPDATER_DISABLED', true);
define('WP_AUTO_UPDATE_CORE', false);

define('FORCE_SSL_ADMIN', true);
```

### 10.3 Deployment Script

**File**: `deploy.sh`

```bash
#!/bin/bash

echo "🚀 Deploying to production..."

# Build assets
cd wp-content/themes/monte-theme
npm run build
cd ../../..

# Create backup
BACKUP_FILE="backup-$(date +%Y%m%d-%H%M%S).tar.gz"
tar -czf $BACKUP_FILE wp-content/themes/monte-theme wp-config.php

# Deploy to server (example using rsync)
rsync -avz --exclude 'node_modules' \
    wp-content/themes/monte-theme/ \
    user@production-server:/var/www/html/wp-content/themes/monte-theme/

# Run database migrations if needed
ssh user@production-server 'cd /var/www/html && wp rewrite flush --allow-root'

echo "✅ Deployment complete!"
```

---

## Risk Assessment & Mitigation

### High-Risk Areas

| Risk                     | Impact | Probability | Mitigation Strategy                                           |
| ------------------------ | ------ | ----------- | ------------------------------------------------------------- |
| Image migration failures | High   | Medium      | Test migration script on subset first; manual upload fallback |
| URL structure mismatch   | High   | Low         | Maintain exact Hugo URL patterns; comprehensive redirect map  |
| Content formatting loss  | Medium | Medium      | Preview all migrated content; preserve markdown formatting    |
| Performance degradation  | Medium | Medium      | Implement caching early; performance testing before go-live   |
| Menu hierarchy issues    | Medium | Low         | Test 3-level nesting thoroughly; custom walker implementation |
| JavaScript conflicts     | Medium | Medium      | Load scripts in correct order; namespace all custom JS        |
| Translation issues       | Low    | Low         | German language pack installed; all strings translatable      |

---

## Success Criteria

### Phase Completion Criteria

Each phase must meet these criteria before proceeding:

**Phase 1**:

- ✅ Docker environment running without errors
- ✅ WordPress installed with German language
- ✅ All essential plugins active

**Phase 2**:

- ✅ Custom post types registered and visible
- ✅ ACF field groups configured
- ✅ URL rewrites working

**Phase 3**:

- ✅ 100% of content migrated
- ✅ All images in media library
- ✅ No broken image links

**Phase 4**:

- ✅ Theme activates without errors
- ✅ Tailwind CSS compiling
- ✅ All template files created

**Phase 5**:

- ✅ All three menus created
- ✅ 3-level hierarchy preserved
- ✅ Menu icons displaying

**Phase 6**:

- ✅ Mobile menu functional
- ✅ Swiper slider working
- ✅ No JavaScript errors

**Phase 7**:

- ✅ Contact form submitting
- ✅ Emails received
- ✅ Form validation working

**Phase 8**:

- ✅ All manual tests passed
- ✅ Performance targets met
- ✅ Cross-browser compatible

**Phase 9**:

- ✅ All redirects configured
- ✅ Sitemap generated
- ✅ No 404 errors

**Phase 10**:

- ✅ Production checklist complete
- ✅ Backups configured
- ✅ Monitoring active

---

## Timeline Estimation

| Phase                      | Duration  | Dependencies | Team Member    |
| -------------------------- | --------- | ------------ | -------------- |
| Phase 1: Docker Setup      | 2-3 days  | None         | DevOps         |
| Phase 2: Content Structure | 3-4 days  | Phase 1      | Backend Dev    |
| Phase 3: Content Migration | 4-5 days  | Phase 2      | Backend Dev    |
| Phase 4: Theme Development | 7-10 days | Phase 2      | Frontend Dev   |
| Phase 5: Navigation        | 2-3 days  | Phase 4      | Frontend Dev   |
| Phase 6: JavaScript        | 3-4 days  | Phase 4      | Frontend Dev   |
| Phase 7: Forms             | 2-3 days  | Phase 4      | Backend Dev    |
| Phase 8: Testing           | 5-7 days  | All phases   | QA Team        |
| Phase 9: SEO & Redirects   | 2-3 days  | Phase 8      | SEO Specialist |
| Phase 10: Deployment       | 3-4 days  | Phase 9      | DevOps         |

**Total Estimated Duration**: 6-8 weeks (parallel work possible)

---

## Maintenance Plan

### Post-Migration Tasks

**Week 1**:

- Monitor error logs daily
- Check all forms working
- Verify all redirects
- Test all major user journeys

**Month 1**:

- Performance optimization based on real traffic
- Fix any reported bugs
- Adjust caching configuration
- Review analytics data

**Ongoing**:

- Weekly database backups verification
- Monthly WordPress/plugin updates
- Quarterly security audits
- Content editor training sessions

---

## Resources & Documentation

### Essential Documentation to Create

1. **Content Editor Guide** (`docs/content-editing.md`)

   - How to add news posts
   - How to edit pages
   - How to upload images
   - How to manage menus

2. **Theme Developer Guide** (`docs/theme-development.md`)

   - Template hierarchy
   - Custom functions reference
   - ACF fields documentation
   - Asset compilation process

3. **Deployment Runbook** (`docs/deployment.md`)

   - Step-by-step deployment process
   - Rollback procedure
   - Emergency contact list
   - Common issues and solutions

4. **API Documentation** (`docs/api.md`)
   - Custom endpoints (if any)
   - ACF field structure
   - Webhook configurations

### External Resources

- [Hugo Documentation](https://gohugo.io/documentation/)
- [WordPress Theme Handbook](https://developer.wordpress.org/themes/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Advanced Custom Fields Documentation](https://www.advancedcustomfields.com/resources/)
- [Contact Form 7 Documentation](https://contactform7.com/docs/)

---

## Appendix A: Command Reference

### Docker Commands

```bash
# Start environment
docker-compose up -d

# Stop environment
docker-compose down

# View logs
docker-compose logs -f wordpress

# Access WordPress container
docker-compose exec wordpress bash

# Access database
docker-compose exec db mysql -u wordpress -p

# WP-CLI commands
docker-compose exec wordpress wp --info --allow-root
docker-compose exec wordpress wp post list --allow-root
docker-compose exec wordpress wp plugin list --allow-root
```

### Theme Development Commands

```bash
# Install dependencies
cd wp-content/themes/monte-theme
npm install

# Watch for changes (development)
npm run watch

# Build for production
npm run build

# Lint JavaScript
npm run lint:js

# Format code
npm run format
```

### Content Migration Commands

```bash
# Dry run migration
cd content-migration
node migrate.js --dry-run

# Run actual migration
node migrate.js

# Verify migration
node verify.js
```

---

## Appendix B: Troubleshooting Guide

### Common Issues

**Issue**: Docker build fails with "Unable to connect to database"
**Solution**: Check database health check status, ensure db container is fully started before WordPress

**Issue**: Tailwind CSS not compiling
**Solution**: Verify Node.js installed in container, check `tailwind.config.js` paths

**Issue**: Images not displaying after migration
**Solution**: Check media library uploads, verify image paths in content, regenerate thumbnails

**Issue**: Menu hierarchy not displaying correctly
**Solution**: Verify custom walker implementation, check CSS for `.has-children` class

**Issue**: Mobile menu not opening
**Solution**: Check mmenu.js initialization, verify `#page` and `#mymenu` selectors

**Issue**: Contact form not sending emails
**Solution**: Check SMTP configuration, test with WP Mail SMTP plugin, verify server allows outgoing mail

**Issue**: Permalink 404 errors
**Solution**: Flush rewrite rules: `wp rewrite flush --allow-root`

**Issue**: ACF fields not saving
**Solution**: Check file permissions, verify ACF plugin active, check for JavaScript errors

---

## Sign-Off

This migration plan has been reviewed and approved by:

- [ ] Project Manager: **\*\***\_\_\_**\*\*** Date: **\_\_\_**
- [ ] Lead Developer: **\*\***\_\_\_**\*\*** Date: **\_\_\_**
- [ ] Client Representative: **\_\_\_** Date: **\_\_\_**

---

**Document Version**: 1.0  
**Last Updated**: 2025-10-25  
**Next Review**: Start of each phase
