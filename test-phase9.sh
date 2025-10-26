#!/bin/bash
#
# Phase 9 Testing: SEO & Redirects
# Validates SEO configuration and URL redirects for Monte-Web migration
#

set -e

echo "=========================================="
echo "Phase 9: SEO & Redirects Testing"
echo "=========================================="
echo ""

WP="docker-compose exec -T wordpress wp --allow-root"
PASSED=0
FAILED=0

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

function test_passed() {
    echo -e "${GREEN}✓${NC} $1"
    ((PASSED++))
}

function test_failed() {
    echo -e "${RED}✗${NC} $1"
    ((FAILED++))
}

function test_info() {
    echo -e "${YELLOW}ℹ${NC} $1"
}

echo "1. Testing Yoast SEO Plugin"
echo "----------------------------"

if $WP plugin is-active wordpress-seo 2>/dev/null; then
    test_passed "Yoast SEO plugin is active"
else
    test_failed "Yoast SEO plugin is not active"
fi

echo ""
echo "2. Testing Redirection Plugin"
echo "-----------------------------"

if $WP plugin is-active redirection 2>/dev/null; then
    test_passed "Redirection plugin is active"
else
    test_failed "Redirection plugin is not active"
fi

echo ""
echo "3. Testing Sitemap Generation"
echo "-----------------------------"

SITEMAP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/sitemap_index.xml)
if [ "$SITEMAP_STATUS" = "200" ]; then
    test_passed "Sitemap index accessible at /sitemap_index.xml (HTTP 200)"
else
    test_failed "Sitemap index not accessible (HTTP $SITEMAP_STATUS)"
fi

# Check individual sitemaps
SITEMAPS=("post-sitemap.xml" "page-sitemap.xml" "news-sitemap.xml" "admission-sitemap.xml" "donation-sitemap.xml" "association-sitemap.xml")
for sitemap in "${SITEMAPS[@]}"; do
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/$sitemap)
    if [ "$STATUS" = "200" ]; then
        test_passed "Individual sitemap /$sitemap accessible (HTTP 200)"
    else
        test_failed "Individual sitemap /$sitemap not accessible (HTTP $STATUS)"
    fi
done

echo ""
echo "4. Testing robots.txt"
echo "--------------------"

ROBOTS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/robots.txt)
if [ "$ROBOTS_STATUS" = "200" ]; then
    test_passed "robots.txt accessible (HTTP 200)"
    
    # Check if robots.txt contains sitemap reference
    if curl -s http://localhost:8080/robots.txt | grep -q "sitemap_index.xml"; then
        test_passed "robots.txt contains sitemap reference"
    else
        test_failed "robots.txt missing sitemap reference"
    fi
else
    test_failed "robots.txt not accessible (HTTP $ROBOTS_STATUS)"
fi

echo ""
echo "5. Testing URL Redirects (Hugo → WordPress)"
echo "-------------------------------------------"

# Test redirects from /pages/* to root
REDIRECTS=(
    "pages/kontakt:kontakt"
    "pages/impressum:impressum"
    "pages/datenschutz:datenschutz"
    "pages/karriere:karriere"
    "pages/presse:presse"
    "pages/speiseplan:speiseplan"
)

for redirect in "${REDIRECTS[@]}"; do
    IFS=':' read -r source target <<< "$redirect"
    
    # Test redirect status code
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/$source/)
    
    if [ "$STATUS" = "301" ]; then
        # Check redirect location
        LOCATION=$(curl -sI http://localhost:8080/$source/ | grep -i "Location:" | awk '{print $2}' | tr -d '\r')
        EXPECTED="http://localhost:8080/$target/"
        
        if [ "$LOCATION" = "$EXPECTED" ]; then
            test_passed "/$source/ redirects to /$target/ (301)"
        else
            test_failed "/$source/ redirects to wrong location: $LOCATION (expected $EXPECTED)"
        fi
    else
        test_failed "/$source/ does not return 301 redirect (got HTTP $STATUS)"
    fi
done

echo ""
echo "6. Testing Main Content URLs (No 404s)"
echo "--------------------------------------"

URLS=(
    ""
    "aktuelles/"
    "kontakt/"
)

for url in "${URLS[@]}"; do
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/$url)
    
    if [ "$STATUS" = "200" ]; then
        test_passed "/$url returns HTTP 200"
    else
        test_failed "/$url returns HTTP $STATUS (expected 200)"
    fi
done

echo ""
echo "7. Testing SEO Meta Fields"
echo "-------------------------"

# Check if SEO migration functions are available
if $WP eval 'echo function_exists("monte_import_yoast_meta") ? "yes" : "no";' 2>/dev/null | grep -q "yes"; then
    test_passed "SEO migration function exists in theme"
else
    test_failed "SEO migration function not found in theme"
fi

echo ""
echo "=========================================="
echo "Test Summary"
echo "=========================================="
echo ""
echo -e "Total Tests: $((PASSED + FAILED))"
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All Phase 9 tests passed!${NC}"
    echo ""
    echo "Phase 9 Deliverables:"
    echo "  ✓ Yoast SEO plugin configured"
    echo "  ✓ SEO migration function created (inc/seo-migration.php)"
    echo "  ✓ URL redirects configured (6 redirects)"
    echo "  ✓ Sitemap generated and accessible"
    echo "  ✓ robots.txt configured with sitemap reference"
    echo ""
    echo "Next Steps:"
    echo "  - Manual: Test redirects in browser"
    echo "  - Manual: Submit sitemap to Google Search Console (production)"
    echo "  - Manual: Verify SEO meta titles and descriptions in WordPress admin"
    echo ""
    exit 0
else
    echo -e "${RED}✗ Some tests failed. Please review the output above.${NC}"
    exit 1
fi
