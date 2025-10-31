# Phase 10: Visual Parity Testing Checklist

**Date:** 2025-10-26  
**Hugo URL:** http://localhost:1313/monte-web/  
**WordPress URL:** http://localhost:8080/  
**Objective:** Ensure 100% visual parity between Hugo and WordPress implementations

---

## Pre-Testing Checklist

- [x] Hugo server running (PID 98164, port 1313)
- [x] WordPress Docker containers running (mysql, wordpress, phpmyadmin, node)
- [x] WordPress theme built successfully with all assets
- [x] Franken UI 2.0.0 integrated (core JS, icon JS)
- [x] Mmenu.js bundled for mobile navigation
- [x] Swiper.js bundled for sliders
- [x] Typography classes compiled (h1-h5, paragraphs)
- [x] Color palette verified (monte blue #222477, bg-light #fcfaf7)
- [x] Header background image implemented
- [x] Kenburns animation classes fixed (`uk-animation-kenburns`, `uk-animation-reverse`)

---

## Desktop Testing (1920px viewport)

### Header & Navigation

- [ ] Logo displays correctly (88px × 118px)
- [ ] Header background image (`header-zaun.jpg`) covers properly
- [ ] Logo link navigates to homepage
- [ ] Sticky navigation bar remains fixed on scroll
- [ ] Navigation bar has correct background color (`bg-light`)
- [ ] Navigation bar has shadow (`shadow-lg`)
- [ ] Top menu items display horizontally
- [ ] Top menu items have correct font weight (700)
- [ ] Menu hover effect works (underline animation, 0.3s ease-out)
- [ ] Menu hover color changes to rgb(18 18 18)
- [ ] Mobile hamburger menu icon hidden on desktop

### Homepage Content

- [ ] Banner title displays with correct font (Zapfino/Tangerine, 8xl, monte blue)
- [ ] Banner content paragraph renders correctly
- [ ] "AKTUELLES" heading styled correctly (lg, bold, monte blue)
- [ ] News cards display in grid (4 columns on xl, 3 on lg, 2 on base)
- [ ] News card images load correctly
- [ ] News card titles styled correctly
- [ ] News card dates formatted correctly
- [ ] News card excerpts displayed
- [ ] Card spacing consistent (mb-2, pr-2)

### Slider Section

- [ ] Slider full-width (`w-screen`, negative margins)
- [ ] Slider images load correctly
- [ ] Kenburns animation effect works (zoom + pan)
- [ ] Animation reverses properly (`uk-animation-reverse`)
- [ ] Transform origin set to center-left
- [ ] Fade transition between slides
- [ ] Autoplay enabled (5s delay in Hugo, check WP)
- [ ] Previous/next navigation arrows appear on hover
- [ ] Slider max-height 600px enforced
- [ ] UIKit slideshow component initialized

### Footer

- [ ] Footer background color correct
- [ ] Footer content centered
- [ ] Footer links styled correctly
- [ ] Social media icons display (if configured)
- [ ] Copyright text displays

### Typography Consistency

- [ ] h1: 2.25rem (36px), weight 800, monte blue
- [ ] h2: 1.875rem (30px), weight 600
- [ ] h3: 1.5rem (24px), weight 600, mt-4
- [ ] h4: 1.25rem (20px), weight 600
- [ ] h5: 1.125rem (18px), weight 600
- [ ] Paragraphs: line-height 1.75rem, mt-6 (not first-child)
- [ ] Links: underline on hover, transition smooth

---

## Tablet Testing (768px viewport)

### Navigation

- [ ] Mobile hamburger menu icon visible
- [ ] Hamburger menu icon positioned correctly (m-3, text-2xl)
- [ ] Hamburger menu icon clickable
- [ ] Top menu items still visible or collapsed appropriately
- [ ] Logo scales appropriately

### Homepage Content

- [ ] Banner title scales down but remains readable
- [ ] News cards adjust to 2 columns (basis-1/2)
- [ ] Card images maintain aspect ratio
- [ ] Slider maintains proper height
- [ ] Slider navigation arrows still functional

### Mobile Menu (Mmenu.js)

- [ ] Mobile menu opens from left when hamburger clicked
- [ ] Mobile menu has title "Montessorischule Gilching"
- [ ] Mobile menu slides in smoothly
- [ ] Mobile menu positioned `left-front`
- [ ] Page content shifts/darkens when menu opens
- [ ] Menu items display correctly
- [ ] Submenu items (if any) expand/collapse
- [ ] Active menu item highlighted
- [ ] Close button works
- [ ] Click outside menu closes it

---

## Mobile Testing (375px viewport)

### Navigation

- [ ] Hamburger menu icon prominent
- [ ] Top menu items hidden or stacked vertically
- [ ] Logo remains visible and proportional

### Homepage Content

- [ ] Banner title remains legible (may wrap)
- [ ] News cards display 2 per row (basis-1/2)
- [ ] Card spacing adequate for touch targets
- [ ] Images load at appropriate size
- [ ] Text remains readable (no overflow)

### Slider

- [ ] Slider images cover viewport
- [ ] Kenburns animation performs smoothly
- [ ] Navigation arrows sized for touch
- [ ] Slider height adjusts appropriately

### Mobile Menu

- [ ] Menu opens smoothly on touch
- [ ] Menu items large enough for touch (min 44px height)
- [ ] Scrolling works within menu if content exceeds viewport
- [ ] No horizontal scrolling issues

---

## Cross-Page Testing

### Test on Multiple Pages

- [ ] Schule > Konzept page
- [ ] Schule > Schulhaus page
- [ ] Aktuelles archive page
- [ ] Individual news post
- [ ] Aufnahme > Anmeldeunterlagen
- [ ] Kontakt page

### Check Each Page For:

- [ ] Header consistent across pages
- [ ] Navigation active state correct
- [ ] Typography consistent
- [ ] Images load correctly
- [ ] Layout matches Hugo equivalent
- [ ] Footer consistent across pages

---

## JavaScript Functionality

### UIKit Components

- [ ] Slideshow initializes (`data-uk-slideshow`)
- [ ] Navigation arrows work (`data-uk-slidenav-*`)
- [ ] Kenburns animation initialized
- [ ] Cover attribute works (`data-uk-cover`)
- [ ] No console errors from UIKit

### Mmenu.js

- [ ] Menu initializes on DOMContentLoaded
- [ ] Hidden class removed from `#mymenu`
- [ ] API methods work (open/close)
- [ ] Toggle button event listener attached
- [ ] No console errors from Mmenu

### Swiper.js

- [ ] Testimonial slider initializes (if present)
- [ ] Homepage slider initializes (if present)
- [ ] Autoplay works
- [ ] Pagination bullets functional
- [ ] Responsive breakpoints work
- [ ] No console errors from Swiper

### Custom Scripts

- [ ] Mailto links get envelope icons
- [ ] Franken UI theme classes applied
- [ ] No JavaScript errors in console

---

## Browser Compatibility

### Chrome/Chromium

- [ ] All features work
- [ ] No console errors
- [ ] Performance acceptable

### Firefox

- [ ] All features work
- [ ] No console errors
- [ ] Performance acceptable

### Safari (if available)

- [ ] All features work
- [ ] No console errors
- [ ] Performance acceptable

---

## Performance Checks

### Asset Loading

- [ ] CSS files load in correct order (fonts → FA → main → bundle)
- [ ] JS files load after DOM ready
- [ ] Images lazy load where appropriate
- [ ] No 404 errors for assets
- [ ] File sizes reasonable (main.js ~751KB, main.css ~33KB, bundle ~51KB)

### Runtime Performance

- [ ] Page load time < 3 seconds
- [ ] Smooth scrolling
- [ ] No layout shifts (CLS)
- [ ] Animations smooth (60fps)
- [ ] Mobile menu opens without lag

---

## Known Differences (Acceptable)

These are expected differences between Hugo (static) and WordPress (dynamic):

1. **URLs**: Hugo uses `/monte-web/` prefix; WordPress uses root `/`
2. **Content**: WordPress content comes from database; Hugo from markdown
3. **Build process**: Hugo builds static HTML; WordPress renders PHP
4. **Font loading**: May differ slightly but should use same fonts (Overpass, Tangerine/Zapfino)

---

## Critical Issues to Fix Before Content Migration

Any failures in these areas MUST be resolved:

- [ ] Header background image
- [ ] Logo display and sizing
- [ ] Navigation menu functionality (desktop + mobile)
- [ ] Typography (h1-h5, paragraphs)
- [ ] Color palette (monte blue, bg-light)
- [ ] Slider functionality and Kenburns animation
- [ ] Mobile menu (Mmenu.js)
- [ ] News card grid layout
- [ ] Responsive behavior at all breakpoints

---

## Testing Instructions

### 1. Open Both Sites Side-by-Side

```bash
# Hugo
open http://localhost:1313/monte-web/

# WordPress
open http://localhost:8080/
```

### 2. Use Browser DevTools

- Open Chrome DevTools (F12)
- Use Device Toolbar (Ctrl+Shift+M) to test responsive views
- Check Console for errors
- Use Network tab to verify asset loading

### 3. Test Responsive Breakpoints

- Desktop: 1920px
- Laptop: 1366px
- Tablet: 768px
- Mobile Large: 425px
- Mobile: 375px
- Mobile Small: 320px

### 4. Screenshot Comparison

Take screenshots at each breakpoint and compare:

```bash
# Hugo screenshot
# WordPress screenshot
# Visual diff tool
```

---

## Sign-Off

**Visual Parity Achieved:** [ ] Yes [ ] No

**Tested By:** ********\_********  
**Date:** ********\_********  
**Notes:**

---

## Next Steps After Sign-Off

Once visual parity is confirmed:

1. Begin content migration (news posts, pages)
2. Configure WordPress settings (permalinks, site info)
3. Set up production environment
4. Deploy to staging server
5. Final QA testing
6. Production deployment
