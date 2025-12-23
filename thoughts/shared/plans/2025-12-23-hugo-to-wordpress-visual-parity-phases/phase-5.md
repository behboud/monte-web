# Phase 5: Slider Component Parity

## Phase Overview

Align homepage slider with UIKit slideshow, Kenburns animation, and autoplay functionality.

**Status**: PENDING

## Changes Required

### 1. UIKit Slideshow Implementation

**File**: `wp-content/themes/monte-theme/front-page.php`
**Current**: Mixed UIKit/Swiper
**Target**: Pure UIKit implementation matching Hugo

```php
// Ensure slider uses UIKit-only, no Swiper
<div class="w-screen left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] uk-visible-toggle uk-position-relative py-4"
     data-uk-slideshow="animation: fade; autoplay:true; max-height: 600">
```

### 2. Kenburns Animation

**File**: `wp-content/themes/monte-theme/front-page.php`
**Current**: May be missing animation classes
**Target**: uk-animation-kenburns with reverse and proper positioning

```php
<img src="<?php echo esc_url($image['url']); ?>"
     alt="<?php echo esc_attr($image['alt']); ?>"
     class="uk-animation-kenburns uk-animation-reverse uk-position-cover uk-transform-origin-center-left"
     data-uk-cover />
```

### 3. Navigation Arrows

**File**: `wp-content/themes/monte-theme/front-page.php`
**Current**: May be missing
**Target**: Previous/next arrows positioned center-left/right

```php
<a class="uk-position-center-left uk-position-small uk-hidden-hover" href="#" data-uk-slidenav-previous data-uk-slidenav-item="previous"></a>
<a class="uk-position-center-right uk-position-small uk-hidden-hover" href="#" data-uk-slidenav-next data-uk-slidenav-item="next"></a>
```

## Success Criteria

### Automated Verification:

- [ ] Slider renders in HTML: `curl -s http://localhost:8080/ | grep -i "uk-slideshow"`
- [ ] Images load in slider: `curl -s http://localhost:8080/ | grep -i "uk-slideshow-items"`

### Manual Verification:

- [ ] Slider full-width (w-screen with negative margins)
- [ ] Images display with Kenburns animation (zoom + pan)
- [ ] Animation reverses properly (uk-animation-reverse)
- [ ] Transform origin center-left
- [ ] Fade transition between slides
- [ ] Autoplay enabled (5s delay)
- [ ] Navigation arrows appear on hover
- [ ] Max height 600px enforced

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation from the human that the manual testing was successful before proceeding to the next phase.
