# WordPress Menu Setup Guide - Monte Theme

## Overview
This guide explains how to set up the three menu locations in the Monte Montessori theme to match the original Hugo site structure.

## Menu Locations

The theme supports three menu locations:

1. **Top Menu** - Small utility menu in the sticky header (News, Contact, Donate, etc.)
2. **Main Menu** - Full navigation menu (accessible via hamburger icon)
3. **Footer Menu** - Legal links in the footer (Impressum, Datenschutz, etc.)

## Setup Instructions

### 1. Access WordPress Menus
1. Log into WordPress Admin (`/wp-admin`)
2. Navigate to **Appearance → Menus**

---

### 2. Create Top Menu

**Location:** Sticky header bar (right side)

#### Menu Items to Create:
1. **NEWS**
   - Link to: Custom URL → `/aktuelles` or Aktuelles archive page
   
2. **KONTAKT**
   - Link to: Page → Kontakt
   
3. **SPENDEN**
   - Link to: Spenden page
   
4. **SPEISEPLAN**
   - Link to: Page → Speiseplan
   - Icon: `fa fa-utensils` (add to Description field)
   
5. **ELTERN-LOGIN**
   - Link to: Custom URL → `https://www.montessorischule-gilching.de/login`
   - Icon: `fa fa-user-lock` (add to Description field)
   - Target: Open in same tab

#### Adding Icons:
1. Click on menu item to expand options
2. Click "Screen Options" (top right) → Enable "Description"
3. In the Description field, add Font Awesome class (e.g., `fa fa-utensils`)
4. The icon will appear automatically before the menu text

#### Assignment:
- Check the box: **Top Menu**

---

### 3. Create Main Menu

**Location:** Mobile/hamburger menu (mmenu sidebar)

#### Menu Structure (Hierarchical):

```
Startseite (/)

Unsere Schule
  └─ Konzept
      ├─ Qualitäten (/schule/konzept/qualitaeten)
      └─ Maria Montessori
          ├─ Zur Person (/schule/konzept/maria-montessori/zur-person)
          └─ Grundzüge der Pädagogik (/schule/konzept/maria-montessori/grundzuege-der-paedagogik)
  └─ Schulhaus
      ├─ Haus (/schule/schulhaus/haus)
      ├─ Küche (/schule/schulhaus/kueche)
      ├─ Schulgeld (/schule/schulhaus/schulgeld)
      └─ Schulordnung (/schule/schulhaus/schulordnung)
  └─ Verwaltung (/schule/verwaltung)
  └─ Pädagogisches Team (/schule/paedagogisches-team)
  └─ Schüler*innen (/schule/schuelerinnen)
  └─ Elternengagement
      ├─ Elternbeirat (/schule/elternengagement/elternbeirat)
      └─ AGs und Dienste (/schule/elternengagement/ags-und-dienste)

Aufnahme
  ├─ Anmeldeunterlagen (/aufnahme/anmeldeunterlagen)
  └─ Schulgeld (/aufnahme/schulgeld)

Spenden und Förderer
  ├─ Förderer (/spenden/foerderer)
  └─ Spenden (/spenden/spenden)

Verein
  ├─ Vorstand (/verein/vorstand)
  └─ Satzung (/verein/satzung)

Karriere (/pages/karriere)

Presse (/pages/presse)
```

#### Creating Hierarchical Menus:
1. Add parent items first (e.g., "Unsere Schule")
2. For child items, drag them slightly to the right under their parent
3. Use the "Sub Item" indentation to create the hierarchy
4. You can nest up to 3 levels deep

#### Assignment:
- Check the box: **Main Menu**

---

### 4. Create Footer Menu

**Location:** Footer center (horizontal list)

#### Menu Items to Create:
1. **Impressum**
   - Link to: Page → Impressum
   
2. **Datenschutzerklärung**
   - Link to: Page → Datenschutz
   
3. **login**
   - Link to: Custom URL → `https://www.montessorischule-gilching.de/login`
   - Target: Open in same tab

#### Assignment:
- Check the box: **Footer Menu**

---

## Additional Features

### Social Media Links
Configure social media links in the footer:

1. Go to **Appearance → Customize**
2. Click **Social Media**
3. Add URLs for:
   - Facebook
   - Instagram
   - Twitter
4. Leave blank to hide that icon

### Custom Logo
1. Go to **Appearance → Customize → Site Identity**
2. Upload your logo (recommended: GIF/PNG/SVG)
3. The logo will appear in the header

---

## Tips & Best Practices

### Menu Item Types:
- **Pages:** Use for internal WordPress pages
- **Custom Links:** Use for external URLs or custom paths
- **Categories/Tags:** Use for archive pages

### Custom URL Format:
- Internal links: `/schule/konzept` (relative URL)
- External links: `https://example.com` (absolute URL)
- Homepage: `/` or leave as "Startseite" page

### Menu Order:
- Use the `weight` field or drag-and-drop to reorder items
- Top to bottom = left to right (in horizontal menus)
- Top to bottom = top to bottom (in vertical/mobile menus)

### Adding Custom Classes:
1. Click "Screen Options" (top right)
2. Enable "CSS Classes"
3. Add custom classes to menu items for styling

---

## Troubleshooting

### Menu not appearing?
- Check if menu is assigned to correct location
- Ensure theme supports menu location (`functions.php:24-28`)
- Clear WordPress cache (if using caching plugin)

### Icons not showing?
- Verify Font Awesome is loaded (check browser console)
- Ensure icon class is in Description field (e.g., `fa fa-utensils`)
- Enable "Description" in Screen Options

### Submenu not working?
- Ensure items are properly indented (drag right to nest)
- Check if menu walker is loaded (`inc/class-menu-walker.php`)
- Verify mmenu-js is enqueued (`functions.php:35-60`)

### Mobile menu not opening?
- Check if mmenu.js is loaded (browser console)
- Ensure `#mymenu` element exists in header
- Verify hamburger icon has correct `href="#mymenu"`

---

## Reference: Hugo Menu Structure

For reference, the original Hugo menu structure is defined in:
- `/config/_default/menus.de.toml`

All menu items from Hugo should be recreated in WordPress using the structure above.

---

## Support

For theme-specific questions:
- Check `/wp-content/themes/monte-theme/functions.php`
- Review menu walker: `/wp-content/themes/monte-theme/inc/class-menu-walker.php`
- Inspect header template: `/wp-content/themes/monte-theme/header.php`

For WordPress menu documentation:
- [WordPress Menu User Guide](https://wordpress.org/support/article/wordpress-menu-user-guide/)
