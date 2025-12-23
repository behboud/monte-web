# Phase 4: Typography Parity

## Phase Overview

Align all heading styles, paragraph formatting, and color usage to match Hugo.

**Status**: COMPLETE ✅

## Changes Required

### 1. Heading Styles (h1-h5)

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

### 2. Paragraph and Link Styling

**File**: `wp-content/themes/monte-theme/assets/css/main.css`
**Current**: Default styling
**Target**: line-height 1.75rem, mt-6 (not first-child), hover underlines

```css
@layer base {
  p {
    @apply uk-paragraph;
  } /* line-height 1.75rem, mt-6 */
}
```

## Success Criteria

### Automated Verification:

- [x] CSS compiles successfully: `cd wp-content/themes/monte-theme && npm run build`
- [x] Typography classes present: `grep -r "uk-h1\|text-monte" wp-content/themes/monte-theme/assets/css/`

### Manual Verification:

- [x] h1: 2.25rem (36px), weight 800, monte blue
- [x] h2: 1.875rem (30px), weight 600
- [x] h3: 1.5rem (24px), weight 600, mt-4
- [x] h4: 1.25rem (20px), weight 600
- [x] h5: 1.125rem (18px), weight 600
- [x] Paragraphs: line-height 1.75rem, mt-6 (not first-child)
- [x] Links: underline on hover, smooth transition

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation from the human that the manual testing was successful before proceeding to the next phase.
