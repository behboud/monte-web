# Phase 7: News Cards Parity

## Phase Overview

Align news card grid layout, responsive breakpoints, and styling to match Hugo.

**Status**: PENDING

## Changes Required

### 1. Card Grid Layout

**File**: `wp-content/themes/monte-theme/front-page.php`
**Current**: Basic grid
**Target**: Responsive grid matching Hugo (4 columns xl, 3 lg, 2 base)

```php
// Ensure grid uses correct responsive classes
<div class="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
```

### 2. Card Styling

**File**: `wp-content/themes/monte-theme/template-parts/card-news.php`
**Current**: Basic card structure
**Target**: Match Hugo's UIKit card with proper spacing

```php
<div class="uk-card uk-card-body h-full flex flex-col justify-between">
    <!-- Content with mb-2, pr-2 spacing -->
</div>
```

## Success Criteria

### Automated Verification:

- [ ] News cards render: `curl -s http://localhost:8080/ | grep -i "uk-card"`
- [ ] Grid layout present: `curl -s http://localhost:8080/ | grep -i "grid-cols"`

### Manual Verification:

- [ ] News cards display in correct grid (4 columns xl, 3 lg, 2 base)
- [ ] Card images load correctly
- [ ] Card titles styled correctly
- [ ] Card dates formatted correctly
- [ ] Card excerpts displayed
- [ ] Card spacing consistent (mb-2, pr-2)

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation from the human that the manual testing was successful before proceeding to the next phase.
