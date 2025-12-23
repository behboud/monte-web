# Phase 6: Mobile Menu Parity

## Phase Overview

Align Mmenu.js implementation with proper positioning, navbar title, and functionality.

**Status**: PENDING

## Changes Required

### 1. Mmenu.js Configuration

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

### 2. Menu Toggle Functionality

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

## Success Criteria

### Automated Verification:

- [ ] Mmenu.js loads: `curl -s http://localhost:8080/ | grep -i "mmenu"`
- [ ] Mobile menu HTML present: `curl -s http://localhost:8080/ | grep -i "mymenu"`

### Manual Verification:

- [ ] Mobile menu opens from left when hamburger clicked
- [ ] Menu has title "Montessorischule Gilching"
- [ ] Menu slides in smoothly with left-front position
- [ ] Page content shifts/darkens when menu opens
- [ ] Menu items display correctly
- [ ] Active menu item highlighted
- [ ] Close button works
- [ ] Click outside menu closes it

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation from the human that the manual testing was successful before proceeding to the next phase.
