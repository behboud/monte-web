#!/bin/bash

# Phase 8: Automated Testing Script
# Monte-Web WordPress Migration

echo "======================================"
echo "Phase 8: Automated Testing & QA"
echo "======================================"
echo ""

WP="docker-compose exec -T wordpress wp --allow-root"

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

PASS=0
FAIL=0

test_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓ PASS${NC}: $2"
        ((PASS++))
    else
        echo -e "${RED}✗ FAIL${NC}: $2"
        ((FAIL++))
    fi
}

echo "1. CONTENT VERIFICATION"
echo "-------------------------"

# Test 1: News posts count
NEWS_COUNT=$($WP post list --post_type=news --format=count)
if [ "$NEWS_COUNT" -ge 6 ]; then
    test_result 0 "News posts migrated ($NEWS_COUNT posts)"
else
    test_result 1 "News posts count insufficient ($NEWS_COUNT posts)"
fi

# Test 2: Pages count
PAGE_COUNT=$($WP post list --post_type=page --format=count)
if [ "$PAGE_COUNT" -ge 20 ]; then
    test_result 0 "Pages migrated ($PAGE_COUNT pages)"
else
    test_result 1 "Pages count insufficient ($PAGE_COUNT pages)"
fi

# Test 3: Media attachments
MEDIA_COUNT=$($WP post list --post_type=attachment --format=count)
if [ "$MEDIA_COUNT" -ge 5 ]; then
    test_result 0 "Media files uploaded ($MEDIA_COUNT files)"
else
    test_result 1 "Media files count low ($MEDIA_COUNT files)"
fi

echo ""
echo "2. URL ACCESSIBILITY TESTS"
echo "-------------------------"

# Test 4: Homepage
STATUS=$(curl -sL -w "%{http_code}" http://localhost:8080/ -o /dev/null)
[ "$STATUS" == "200" ] && test_result 0 "Homepage accessible (200)" || test_result 1 "Homepage error ($STATUS)"

# Test 5: News archive
STATUS=$(curl -sL -w "%{http_code}" http://localhost:8080/aktuelles/ -o /dev/null)
[ "$STATUS" == "200" ] && test_result 0 "News archive accessible (200)" || test_result 1 "News archive error ($STATUS)"

# Test 6: Contact page
STATUS=$(curl -sL -w "%{http_code}" http://localhost:8080/kontakt/ -o /dev/null)
[ "$STATUS" == "200" ] && test_result 0 "Contact page accessible (200)" || test_result 1 "Contact page error ($STATUS)"

# Test 7: Single news post
STATUS=$(curl -sL -w "%{http_code}" http://localhost:8080/aktuelles/post-1/ -o /dev/null)
[ "$STATUS" == "200" ] && test_result 0 "Single news post accessible (200)" || test_result 1 "Single news post error ($STATUS)"

# Test 8: 404 page
STATUS=$(curl -sL -w "%{http_code}" http://localhost:8080/nonexistent-page/ -o /dev/null)
[ "$STATUS" == "404" ] && test_result 0 "404 page working correctly (404)" || test_result 1 "404 page error ($STATUS)"

echo ""
echo "3. WORDPRESS CONFIGURATION"
echo "-------------------------"

# Test 9: Permalink structure
PERMALINK=$($WP option get permalink_structure)
[ "$PERMALINK" == "/%postname%/" ] && test_result 0 "Permalink structure correct" || test_result 1 "Permalink structure wrong ($PERMALINK)"

# Test 10: German language
LANG=$($WP language core list --status=active --field=language)
[ "$LANG" == "de_DE" ] && test_result 0 "German language active" || test_result 1 "Language incorrect ($LANG)"

# Test 11: Active theme
THEME=$($WP theme list --status=active --field=name)
[ "$THEME" == "monte-theme" ] && test_result 0 "Custom theme active" || test_result 1 "Wrong theme active ($THEME)"

# Test 12: Active plugins count
PLUGIN_COUNT=$($WP plugin list --status=active --format=count)
if [ "$PLUGIN_COUNT" -ge 7 ]; then
    test_result 0 "Plugins activated ($PLUGIN_COUNT plugins)"
else
    test_result 1 "Insufficient active plugins ($PLUGIN_COUNT plugins)"
fi

echo ""
echo "4. MENU & NAVIGATION"
echo "-------------------------"

# Test 13: Menus created
MENU_COUNT=$($WP menu list --format=count)
[ "$MENU_COUNT" -ge 3 ] && test_result 0 "Menus created ($MENU_COUNT menus)" || test_result 1 "Menus missing ($MENU_COUNT menus)"

# Test 14: Menu locations assigned
LOCATIONS=$($WP menu location list --format=count)
[ "$LOCATIONS" -ge 3 ] && test_result 0 "Menu locations assigned ($LOCATIONS locations)" || test_result 1 "Menu locations not assigned ($LOCATIONS locations)"

echo ""
echo "5. PERFORMANCE TESTS"
echo "-------------------------"

# Test 15: Homepage load time
LOAD_TIME=$(curl -o /dev/null -s -w '%{time_total}' http://localhost:8080/)
if (( $(echo "$LOAD_TIME < 2.0" | bc -l) )); then
    test_result 0 "Homepage load time acceptable (${LOAD_TIME}s < 2s)"
else
    test_result 1 "Homepage load time too slow (${LOAD_TIME}s)"
fi

# Test 16: News archive load time
LOAD_TIME=$(curl -o /dev/null -s -w '%{time_total}' http://localhost:8080/aktuelles/)
if (( $(echo "$LOAD_TIME < 2.0" | bc -l) )); then
    test_result 0 "News archive load time acceptable (${LOAD_TIME}s < 2s)"
else
    test_result 1 "News archive load time too slow (${LOAD_TIME}s)"
fi

echo ""
echo "6. THEME & ASSETS"
echo "-------------------------"

# Test 17: CSS file exists
if [ -f "wp-content/themes/monte-theme/dist/css/main.css" ]; then
    test_result 0 "Compiled CSS exists"
else
    test_result 1 "Compiled CSS missing"
fi

# Test 18: JS file exists
if [ -f "wp-content/themes/monte-theme/dist/js/main.js" ]; then
    test_result 0 "Compiled JS exists"
else
    test_result 1 "Compiled JS missing"
fi

# Test 19: Custom post types registered
CPT_COUNT=$($WP post-type list --field=name | grep -c "news\|admission\|donation\|association")
if [ "$CPT_COUNT" -ge 4 ]; then
    test_result 0 "Custom post types registered ($CPT_COUNT types)"
else
    test_result 1 "Custom post types missing ($CPT_COUNT types)"
fi

echo ""
echo "7. CONTACT FORM"
echo "-------------------------"

# Test 20: Contact Form 7 active
if $WP plugin is-active contact-form-7; then
    test_result 0 "Contact Form 7 plugin active"
else
    test_result 1 "Contact Form 7 plugin not active"
fi

# Test 21: Contact form present on page
if curl -s http://localhost:8080/kontakt/ | grep -q "wpcf7"; then
    test_result 0 "Contact form present on /kontakt/"
else
    test_result 1 "Contact form not found on /kontakt/"
fi

echo ""
echo "======================================"
echo "TEST SUMMARY"
echo "======================================"
echo -e "${GREEN}Passed: $PASS${NC}"
echo -e "${RED}Failed: $FAIL${NC}"
TOTAL=$((PASS + FAIL))
echo "Total: $TOTAL"
echo ""

if [ $FAIL -eq 0 ]; then
    echo -e "${GREEN}✓ All tests passed! Phase 8 automated testing complete.${NC}"
    exit 0
else
    echo -e "${YELLOW}⚠ Some tests failed. Please review and fix issues.${NC}"
    exit 1
fi
