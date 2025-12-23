# Hugo to WordPress Visual Parity Implementation Plan

## Overview

This plan addresses the critical issue where the Hugo to WordPress migration is technically functional but lacks visual parity. The WordPress theme implementation diverges significantly from the Hugo design, requiring systematic alignment across all UI components. The goal is to achieve 100% visual parity with the Hugo template design before deploying to production.

**Scope**: This plan focuses exclusively on template/theme migration. No content data migration is included - only the visual design, styles, and functionality need to match.

## Current State Analysis

### Hugo Implementation (Reference)

- **Static site** built with Hugo, using Tailwind CSS + UIKit components
- **Header**: Logo positioned with `justify-self-end`, background image via partial
- **Navigation**: Sticky top bar with `bg-light` background, `shadow-lg`, font weight 700
- **Mobile Menu**: Mmenu.js with `left-front` position, custom navbar title
- **Slider**: UIKit slideshow with fade animation, Kenburns effect, autoplay
- **Typography**: Consistent UIKit classes (uk-h1 through uk-h5, uk-paragraph)
- **News Cards**: UIKit card structure with responsive grid (basis-1/2 on mobile, lg:basis-1/3, xl:basis-1/4)
- **Color Palette**: Monte blue (#222477), bg-light (#fcfaf7)

### WordPress Implementation (Current Issues)

- **Theme exists** but visual output differs significantly from Hugo
- **Header**: Uses inline background styles instead of Hugo's partial approach
- **Navigation**: Custom menu walker but styling doesn't match Hugo's hover effects
- **Mobile Menu**: Mmenu.js initialized but positioning/functionality may differ
- **Slider**: Has both UIKit and Swiper implementations, unclear which is active
- **Typography**: Tailwind + UIKit but compiled CSS may not match Hugo's base styles
- **News Cards**: Template structure exists but responsive behavior unverified
- **Assets**: Webpack bundling with Franken UI 2.0.0, but integration unclear

### Key Differences Identified

1. **Header Background**: Hugo uses `partial "bg-image"`; WordPress uses inline `style="background-image: url(...)"`
2. **Navigation Rendering**: Hugo uses `site.Menus.top`; WordPress uses `wp_nav_menu` with Monte_Menu_Walker
3. **Menu Icons**: Hugo uses `.Params.icon`; WordPress uses menu item descriptions for Font Awesome classes
4. **Slider Implementation**: Hugo uses UIKit-only; WordPress has both UIKit and Swiper code
5. **CSS Architecture**: Hugo has source CSS with @layer directives; WordPress has compiled bundles
6. **Image Processing**: Hugo uses Hugo resources pipeline; WordPress uses direct ACF field URLs

## Desired End State

After completing this plan:

- **Visual Parity**: 100% visual match between Hugo (localhost:1313/monte-web/) and WordPress (localhost:8080/) across all breakpoints
- **Functionality**: All interactive elements work identically (navigation, mobile menu, slider, forms)
- **Performance**: Page load < 3 seconds, smooth animations (60fps), no console errors
- **Responsive**: Perfect behavior at 375px, 768px, 1366px, 1920px breakpoints
- **Browser Support**: Works correctly in Chrome, Firefox, and Safari
- **Production Ready**: Theme ready for deployment (content population happens separately)

### Success Verification

- All items in PHASE10-VISUAL-PARITY-CHECKLIST.md checked off
- Side-by-side visual comparison shows no differences
- Automated tests pass for critical functionality
- Manual testing confirms responsive behavior and interactions

## What We're NOT Doing

- **Content data migration** (news posts, pages, media uploads) - this is a separate effort after visual parity
- WordPress configuration changes (permalinks, site settings)
- Production deployment or server configuration
- SEO optimization or analytics integration
- Additional features beyond current Hugo functionality

## Implementation Approach

### Strategy

1. **Side-by-Side Development**: Run both Hugo (`hugo server`) and WordPress (`docker compose up`) simultaneously
2. **Component-by-Component Alignment**: Fix one UI component at a time, verifying against Hugo reference
3. **Breakpoint Testing**: Test each change across all responsive breakpoints (375px, 768px, 1366px, 1920px)
4. **Iterative Verification**: Use browser dev tools and visual comparison to ensure pixel-perfect parity

### Tools Required

- **Hugo Server**: `hugo server` (port 1313)
- **WordPress Stack**: `docker compose up` (MySQL, WordPress, phpMyAdmin, Node)
- **Browser DevTools**: For responsive testing and console error checking
- **Visual Comparison**: Side-by-side browser windows or screenshot diff tools

## Implementation Phases

### Phase 1: Setup and Initial Assessment

**Status**: ✅ COMPLETE

[Phase 1 Details](2025-12-23-hugo-to-wordpress-visual-parity-phases/phase-1.md)

Establish development environment and perform detailed visual comparison to identify all parity issues.

---

### Phase 2: Header Component Parity

**Status**: ✅ COMPLETE

[Phase 2 Details](2025-12-23-hugo-to-wordpress-visual-parity-phases/phase-2.md)

Align header logo, background image, and positioning to match Hugo exactly.

---

### Phase 3: Navigation Menu Parity

**Status**: ✅ COMPLETE

[Phase 3 Details](2025-12-23-hugo-to-wordpress-visual-parity-phases/phase-3.md)

Align desktop navigation bar styling, hover effects, and mobile menu functionality.

---

### Phase 4: Typography Parity

**Status**: PENDING

[Phase 4 Details](2025-12-23-hugo-to-wordpress-visual-parity-phases/phase-4.md)

Align all heading styles, paragraph formatting, and color usage to match Hugo.

---

### Phase 5: Slider Component Parity

**Status**: PENDING

[Phase 5 Details](2025-12-23-hugo-to-wordpress-visual-parity-phases/phase-5.md)

Align homepage slider with UIKit slideshow, Kenburns animation, and autoplay functionality.

---

### Phase 6: Mobile Menu Parity

**Status**: PENDING

[Phase 6 Details](2025-12-23-hugo-to-wordpress-visual-parity-phases/phase-6.md)

Align Mmenu.js implementation with proper positioning, navbar title, and functionality.

---

### Phase 7: News Cards Parity

**Status**: PENDING

[Phase 7 Details](2025-12-23-hugo-to-wordpress-visual-parity-phases/phase-7.md)

Align news card grid layout, responsive breakpoints, and styling to match Hugo.

---

### Phase 8: Responsive Behavior Verification

**Status**: PENDING

[Phase 8 Details](2025-12-23-hugo-to-wordpress-visual-parity-phases/phase-8.md)

Test and fix responsive behavior across all breakpoints defined in the checklist.

---

### Phase 9: JavaScript Functionality Verification

**Status**: PENDING

[Phase 9 Details](2025-12-23-hugo-to-wordpress-visual-parity-phases/phase-9.md)

Verify all JavaScript components initialize and function correctly.

---

### Phase 10: Performance and Browser Testing

**Status**: PENDING

[Phase 10 Details](2025-12-23-hugo-to-wordpress-visual-parity-phases/phase-10.md)

Final verification of performance requirements and cross-browser compatibility.

---

## Testing Strategy

### Unit Tests:

- CSS compilation: `npm run build` in theme directory
- PHP syntax: Basic linting of theme files
- Asset loading: Verify file paths and existence

### Integration Tests:

- Theme activation: WordPress admin theme switching
- Menu configuration: Verify menu locations and items
- ACF field setup: Check field groups and data

### Manual Testing Steps:

1. **Header Verification**: Logo size, background positioning, link functionality
2. **Navigation Testing**: Desktop hover effects, mobile menu operation
3. **Content Verification**: Typography rendering, spacing consistency
4. **Interactive Elements**: Slider autoplay, navigation arrows, form submissions
5. **Responsive Testing**: Each breakpoint with device toolbar
6. **Cross-Browser**: Feature testing in Chrome, Firefox, Safari
7. **Performance**: Load time measurement, animation smoothness

## Performance Considerations

### Asset Optimization:

- Webpack bundling with cache-busting timestamps
- Font loading: Overpass and Tangerine from Google Fonts
- Image optimization: Proper sizing and lazy loading where appropriate

### JavaScript Efficiency:

- DOMContentLoaded initialization to prevent blocking
- Error handling to prevent script failures from breaking functionality
- Efficient event listeners and API usage

### Database Performance:

- Minimal queries on homepage (4 news posts)
- Proper indexing for custom post types
- Caching considerations for production

## Migration Notes

### Theme Dependencies:

- ACF fields must be configured for banner_title, banner_content, slider_images
- Custom post type 'news' with proper meta fields
- Menu locations configured in theme setup

### Rollback Strategy:

- Git versioning for all theme changes
- Database backups before any structural changes
- Ability to revert to previous theme version

## References

- Visual parity checklist: `PHASE10-VISUAL-PARITY-CHECKLIST.md`
- Hugo implementation: `layouts/`, `assets/css/`, `assets/js/`
- WordPress theme: `wp-content/themes/monte-theme/`
