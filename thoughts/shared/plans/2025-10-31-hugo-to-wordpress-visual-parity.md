# Hugo to WordPress Visual Parity Implementation Plan

## Overview

This plan addresses the critical issue where the Hugo to WordPress migration is technically functional but lacks visual parity. The WordPress theme implementation diverges significantly from the Hugo design, requiring systematic alignment across all UI components. The goal is to achieve 100% visual parity as defined in PHASE10-VISUAL-PARITY-CHECKLIST.md before proceeding with content migration.

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
- **Content Ready**: Visual foundation complete for content migration

### Success Verification

- All items in PHASE10-VISUAL-PARITY-CHECKLIST.md checked off
- Side-by-side visual comparison shows no differences
- Automated tests pass for critical functionality
- Manual testing confirms responsive behavior and interactions

## What We're NOT Doing

- Content migration (news posts, pages, media) - blocked until visual parity achieved
- WordPress configuration changes (permalinks, site settings)
- Production deployment preparation
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

## Phase 1: Setup and Initial Assessment

### Overview

Establish development environment and perform detailed visual comparison to identify all parity issues.

### Changes Required:

#### 1. Launch Development Environment

**Command**: Start both systems side-by-side

```bash
# Terminal 1: Hugo
cd /home/bebud/workspace/monte-web
hugo server

# Terminal 2: WordPress
cd /home/bebud/workspace/monte-web
docker compose up
```

#### 2. Visual Comparison Setup

**Browser**: Open both sites side-by-side

- Hugo: http://localhost:1313/monte-web/
- WordPress: http://localhost:8080/

#### 3. Screenshot Baseline

**Tools**: Browser dev tools responsive mode
Take screenshots at each breakpoint: 375px, 768px, 1366px, 1920px

### Success Criteria:

#### Automated Verification:

- [x] Hugo server running successfully: `curl -s http://localhost:1313/monte-web/ | head -n 5`
- [x] WordPress containers running: `docker ps | grep -E "(mysql|wordpress)"`
- [x] WordPress site accessible: `curl -s http://localhost:8080/ | grep -i wordpress`

#### Manual Verification:

- [x] Both sites load without errors in browser
- [x] Initial visual differences documented with screenshots
- [x] PHASE10 checklist reviewed and prioritized issues identified

## Phase 2: Header Component Parity

### Overview

Align header logo, background image, and positioning to match Hugo exactly.

### Changes Required:

#### 1. Header Background Image Implementation

**File**: `wp-content/themes/monte-theme/header.php`
**Current**: Inline style background-image
**Target**: Match Hugo's background positioning and sizing

```php
// Current (lines 13-15)
<div class="container pr-0" style="background-image: url(<?php echo get_template_directory_uri(); ?>/assets/images/header-zaun.jpg); background-size: cover; background-position: center center; background-repeat: no-repeat;">

// Ensure matches Hugo's partial "bg-image" behavior
```

#### 2. Logo Display and Sizing

**File**: `wp-content/themes/monte-theme/header.php`
**Current**: Custom logo or site title
**Target**: 88px × 118px dimensions, proper positioning

```php
// Verify logo dimensions and positioning match Hugo's justify-self-end layout
```

### Success Criteria:

#### Automated Verification:

- [x] Header background image loads: `curl -s http://localhost:8080/ | grep -i header-zaun.jpg`
- [x] Logo link functional: `curl -s http://localhost:8080/ | grep -A5 -B5 "logo-link"`
- [x] Fixed duplicate <a> tags in header and footer (wp-content/themes/monte-theme/header.php, footer.php)

#### Manual Verification:

- [x] Logo displays at correct size (88px × 118px)
- [x] Header background image covers properly
- [x] Logo positioning matches Hugo (justify-self-end)

## Phase 3: Navigation Menu Parity ✅ COMPLETE

### Overview

Align desktop navigation bar styling, hover effects, and mobile menu functionality.

### Changes Completed:

#### 1. Top Navigation Styling ✅

**File**: `wp-content/themes/monte-theme/header.php`
**Status**: Implemented
**Changes**:

- Sticky navigation with bg-light, shadow-lg, text-monte applied
- Added flexbox vertical alignment with `items-center` class
- Icon and text properly separated with spacing

#### 2. Menu Icon and Text Rendering ✅

**File**: `wp-content/themes/monte-theme/inc/class-menu-walker.php`
**Status**: Refactored
**Changes**:

- Separated icon and text into distinct `<a>` elements
- Added `mr-2` spacing between icon and text
- Implemented responsive visibility: text hidden on mobile (`hidden sm:inline-block`)
- Applied proper styling classes: `uk-btn`, `uk-btn-text`, `font-bold`

#### 3. Mobile Menu Toggle ✅

**File**: `wp-content/themes/monte-theme/header.php`
**Status**: Verified
**Implementation**:

```php
<li class="text-2xl m-3">
    <a class="fa fa-bars font-bold" href="#mymenu" id="mobile-menu-toggle"></a>
</li>
```

#### 4. Tailwind Configuration ✅

**File**: `tailwind.config.js`
**Status**: Updated
**Changes**: Added responsive utility classes to safelist:

- `hidden`
- `sm:inline-block`
- `max-sm:hidden`

### Success Criteria:

#### Automated Verification:

- [x] Navigation menu renders: `curl -s http://localhost:8080/ | grep -i "navbar-nav"`
- [x] Mobile menu toggle present: `curl -s http://localhost:8080/ | grep -i "mobile-menu-toggle"`

#### Manual Verification:

- [x] Sticky navigation bar has correct background (bg-light) and shadow (shadow-lg)
- [x] Top menu items have font weight 700
- [x] Icon and text properly spaced with `mr-2` margin
- [x] Icons vertically aligned with text using flexbox `items-center`
- [x] Mobile hamburger menu icon visible on tablet/desktop, functional
- [x] Menu text hidden on mobile (< 640px), visible on desktop (≥ 640px)

## Phase 4: Typography Parity

### Overview

Align all heading styles, paragraph formatting, and color usage to match Hugo.

### Changes Required:

#### 1. Heading Styles (h1-h5)

**File**: `wp-content/themes/monte-theme/assets/css/main.css`
**Current**: Compiled CSS
**Target**: Match Hugo's uk-h1 through uk-h5 classes with monte blue color

```css
@layer base {
  h1,
  h2,
  h3,
  h4,
  h5 {
    @apply text-monte;
  }
  h1 {
    @apply uk-h1;
  } /* 2.25rem (36px), weight 800, monte blue */
  h2 {
    @apply uk-h2;
  } /* 1.875rem (30px), weight 600 */
  h3 {
    @apply uk-h3 mt-4;
  } /* 1.5rem (24px), weight 600, mt-4 */
  h4 {
    @apply uk-h4;
  } /* 1.25rem (20px), weight 600 */
  h5 {
    @apply uk-h5;
  } /* 1.125rem (18px), weight 600 */
}
```

#### 2. Paragraph and Link Styling

**File**: `wp-content/themes/monte-theme/assets/css/main.css`
**Current**: Default styling
**Target**: line-height 1.75rem, mt-6 (not first-child), hover underlines

```css
@layer base {
  p {
    @apply uk-paragraph;
  } /* line-height 1.75rem, mt-6 */
  a {
    @apply hover:underline transition-all;
  }
}
```

### Success Criteria:

#### Automated Verification:

- [ ] CSS compiles successfully: `cd wp-content/themes/monte-theme && npm run build`
- [ ] Typography classes present: `grep -r "uk-h1\|text-monte" wp-content/themes/monte-theme/assets/css/`

#### Manual Verification:

- [ ] h1: 2.25rem (36px), weight 800, monte blue
- [ ] h2: 1.875rem (30px), weight 600
- [ ] h3: 1.5rem (24px), weight 600, mt-4
- [ ] h4: 1.25rem (20px), weight 600
- [ ] h5: 1.125rem (18px), weight 600
- [ ] Paragraphs: line-height 1.75rem, mt-6 (not first-child)
- [ ] Links: underline on hover, smooth transition

## Phase 5: Slider Component Parity

### Overview

Align homepage slider with UIKit slideshow, Kenburns animation, and autoplay functionality.

### Changes Required:

#### 1. UIKit Slideshow Implementation

**File**: `wp-content/themes/monte-theme/front-page.php`
**Current**: Mixed UIKit/Swiper
**Target**: Pure UIKit implementation matching Hugo

```php
// Ensure slider uses UIKit-only, no Swiper
<div class="w-screen left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] uk-visible-toggle uk-position-relative py-4"
     data-uk-slideshow="animation: fade; autoplay:true; max-height: 600">
```

#### 2. Kenburns Animation

**File**: `wp-content/themes/monte-theme/front-page.php`
**Current**: May be missing animation classes
**Target**: uk-animation-kenburns with reverse and proper positioning

```php
<img src="<?php echo esc_url($image['url']); ?>"
     alt="<?php echo esc_attr($image['alt']); ?>"
     class="uk-animation-kenburns uk-animation-reverse uk-position-cover uk-transform-origin-center-left"
     data-uk-cover />
```

#### 3. Navigation Arrows

**File**: `wp-content/themes/monte-theme/front-page.php`
**Current**: May be missing
**Target**: Previous/next arrows positioned center-left/right

```php
<a class="uk-position-center-left uk-position-small uk-hidden-hover" href="#" data-uk-slidenav-previous data-uk-slidenav-item="previous"></a>
<a class="uk-position-center-right uk-position-small uk-hidden-hover" href="#" data-uk-slidenav-next data-uk-slidenav-item="next"></a>
```

### Success Criteria:

#### Automated Verification:

- [ ] Slider renders in HTML: `curl -s http://localhost:8080/ | grep -i "uk-slideshow"`
- [ ] Images load in slider: `curl -s http://localhost:8080/ | grep -i "uk-slideshow-items"`

#### Manual Verification:

- [ ] Slider full-width (w-screen with negative margins)
- [ ] Images display with Kenburns animation (zoom + pan)
- [ ] Animation reverses properly (uk-animation-reverse)
- [ ] Transform origin center-left
- [ ] Fade transition between slides
- [ ] Autoplay enabled (5s delay)
- [ ] Navigation arrows appear on hover
- [ ] Max height 600px enforced

## Phase 6: Mobile Menu Parity

### Overview

Align Mmenu.js implementation with proper positioning, navbar title, and functionality.

### Changes Required:

#### 1. Mmenu.js Configuration

**File**: `wp-content/themes/monte-theme/assets/js/main.js`
**Current**: Basic initialization
**Target**: Match Hugo's left-front position and navbar title

```javascript
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
```

#### 2. Menu Toggle Functionality

**File**: `wp-content/themes/monte-theme/assets/js/main.js`
**Current**: Basic click handler
**Target**: Proper API integration with error handling

```javascript
// Ensure toggle properly opens menu via API
const toggleButton = document.querySelector("#mobile-menu-toggle");
if (toggleButton) {
  toggleButton.addEventListener("click", function (e) {
    e.preventDefault();
    menu.API.open();
  });
}
```

### Success Criteria:

#### Automated Verification:

- [ ] Mmenu.js loads: `curl -s http://localhost:8080/ | grep -i "mmenu"`
- [ ] Mobile menu HTML present: `curl -s http://localhost:8080/ | grep -i "mymenu"`

#### Manual Verification:

- [ ] Mobile menu opens from left when hamburger clicked
- [ ] Menu has title "Montessorischule Gilching"
- [ ] Menu slides in smoothly with left-front position
- [ ] Page content shifts/darkens when menu opens
- [ ] Menu items display correctly
- [ ] Active menu item highlighted
- [ ] Close button works
- [ ] Click outside menu closes it

## Phase 7: News Cards Parity

### Overview

Align news card grid layout, responsive breakpoints, and styling to match Hugo.

### Changes Required:

#### 1. Card Grid Layout

**File**: `wp-content/themes/monte-theme/front-page.php`
**Current**: Basic grid
**Target**: Responsive grid matching Hugo (4 columns xl, 3 lg, 2 base)

```php
// Ensure grid uses correct responsive classes
<div class="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
```

#### 2. Card Styling

**File**: `wp-content/themes/monte-theme/template-parts/card-news.php`
**Current**: Basic card structure
**Target**: Match Hugo's UIKit card with proper spacing

```php
<div class="uk-card uk-card-body h-full flex flex-col justify-between">
    <!-- Content with mb-2, pr-2 spacing -->
</div>
```

### Success Criteria:

#### Automated Verification:

- [ ] News cards render: `curl -s http://localhost:8080/ | grep -i "uk-card"`
- [ ] Grid layout present: `curl -s http://localhost:8080/ | grep -i "grid-cols"`

#### Manual Verification:

- [ ] News cards display in correct grid (4 columns xl, 3 lg, 2 base)
- [ ] Card images load correctly
- [ ] Card titles styled correctly
- [ ] Card dates formatted correctly
- [ ] Card excerpts displayed
- [ ] Card spacing consistent (mb-2, pr-2)

## Phase 8: Responsive Behavior Verification

### Overview

Test and fix responsive behavior across all breakpoints defined in the checklist.

### Changes Required:

#### 1. Breakpoint Testing

**Tools**: Browser DevTools responsive mode
**Breakpoints**: 375px, 768px, 1366px, 1920px

#### 2. Component-Specific Fixes

**Navigation**: Hamburger visible on tablet, hidden on desktop
**Slider**: Maintains height, navigation functional on touch
**Cards**: Adjust to 2 columns on mobile/tablet
**Typography**: Scales appropriately on small screens

### Success Criteria:

#### Manual Verification:

- [ ] Desktop (1920px): All features work, navigation horizontal
- [ ] Laptop (1366px): Layout adjusts, hamburger appears
- [ ] Tablet (768px): Mobile menu functional, cards in 2 columns
- [ ] Mobile Large (425px): Touch targets adequate, content readable
- [ ] Mobile (375px): All elements functional, no overflow

## Phase 9: JavaScript Functionality Verification

### Overview

Verify all JavaScript components initialize and function correctly.

### Changes Required:

#### 1. UIKit Components

**File**: `wp-content/themes/monte-theme/assets/js/main.js`
**Verification**: Slideshow, navigation arrows, Kenburns animation

#### 2. Mmenu.js

**File**: `wp-content/themes/monte-theme/assets/js/main.js`
**Verification**: Menu initialization, API methods, toggle functionality

#### 3. Swiper.js (if used)

**File**: `wp-content/themes/monte-theme/assets/js/main.js`
**Verification**: Initialization, autoplay, pagination, navigation

#### 4. Custom Scripts

**File**: `wp-content/themes/monte-theme/assets/js/main.js`
**Verification**: Mailto links, Franken UI integration

### Success Criteria:

#### Automated Verification:

- [ ] No JavaScript errors: Browser console inspection
- [ ] Components initialize: Check for initialized class names

#### Manual Verification:

- [ ] UIKit slideshow initializes (data-uk-slideshow)
- [ ] Navigation arrows work (data-uk-slidenav-\*)
- [ ] Kenburns animation active
- [ ] Mmenu initializes on DOMContentLoaded
- [ ] Hidden class removed from #mymenu
- [ ] Menu API methods work (open/close)
- [ ] Toggle button event listener attached
- [ ] Mailto links get envelope icons
- [ ] Franken UI theme classes applied

## Phase 10: Performance and Browser Testing

### Overview

Final verification of performance requirements and cross-browser compatibility.

### Changes Required:

#### 1. Performance Testing

**Tools**: Browser DevTools Network/Performance tabs
**Metrics**: Load time < 3s, smooth animations, no layout shifts

#### 2. Browser Compatibility

**Browsers**: Chrome, Firefox, Safari (if available)
**Verification**: All features work without console errors

### Success Criteria:

#### Automated Verification:

- [ ] Asset loading verified: Check Network tab for 404s
- [ ] Bundle sizes reasonable: main.js ~751KB, main.css ~33KB, bundle ~51KB

#### Manual Verification:

- [ ] Page load time < 3 seconds
- [ ] Smooth scrolling and animations (60fps)
- [ ] No layout shifts (CLS)
- [ ] No console errors in any browser
- [ ] All features work in Chrome, Firefox, Safari

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

### Content Dependencies:

- ACF fields must be configured for banner_title, banner_content, slider_images
- Custom post type 'news' with proper meta fields
- Menu locations configured in theme setup

### Rollback Strategy:

- Git versioning for all theme changes
- Database backups before content migration
- Ability to revert to previous theme version

## References

- Visual parity checklist: `PHASE10-VISUAL-PARITY-CHECKLIST.md`
- Hugo implementation: `layouts/`, `assets/css/`, `assets/js/`
- WordPress theme: `wp-content/themes/monte-theme/`
- Migration plan: `thoughts/shared/plans/hugo-to-wordpress-migration.md`
