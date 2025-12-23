# Phase 2: Header Component Parity

## Phase Overview

Align header logo, background image, and positioning to match Hugo exactly.

**Status**: ✅ COMPLETE

## Changes Required

### 1. Header Background Image Implementation

**File**: `wp-content/themes/monte-theme/header.php`
**Current**: Inline style background-image
**Target**: Match Hugo's background positioning and sizing

```php
// Current (lines 13-15)
<div class="container pr-0" style="background-image: url(<?php echo get_template_directory_uri(); ?>/assets/images/header-zaun.jpg); background-size: cover; background-position: center center; background-repeat: no-repeat;">

// Ensure matches Hugo's partial "bg-image" behavior
```

### 2. Logo Display and Sizing

**File**: `wp-content/themes/monte-theme/header.php`
**Current**: Custom logo or site title
**Target**: 88px × 118px dimensions, proper positioning

```php
// Verify logo dimensions and positioning match Hugo's justify-self-end layout
```

## Success Criteria

### Automated Verification:

- [x] Header background image loads: `curl -s http://localhost:8080/ | grep -i header-zaun.jpg`
- [x] Logo link functional: `curl -s http://localhost:8080/ | grep -A5 -B5 "logo-link"`
- [x] Fixed duplicate <a> tags in header and footer (wp-content/themes/monte-theme/header.php, footer.php)

### Manual Verification:

- [x] Logo displays at correct size (88px × 118px)
- [x] Header background image covers properly
- [x] Logo positioning matches Hugo (justify-self-end)

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation from the human that the manual testing was successful before proceeding to the next phase.
