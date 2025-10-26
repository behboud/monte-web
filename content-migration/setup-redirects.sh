#!/bin/bash
#
# Setup Redirects for Hugo to WordPress Migration
# This script configures the Redirection plugin with URL mappings from Hugo structure to WordPress
#

set -e

echo "🔗 Setting up URL redirects for Monte-Web migration..."

WP="docker-compose exec -T wordpress wp --allow-root"

# Ensure Redirection plugin is active
echo "Activating Redirection plugin..."
$WP plugin activate redirection 2>/dev/null || echo "Redirection already active"

# Wait a moment for plugin to initialize
sleep 2

# Import redirects using WP-CLI Redirection commands
# Note: The Redirection plugin stores redirects in its own database tables

echo "Creating redirect rules..."

# Pages that moved from /pages/ to root
$WP redirection create /pages/kontakt/ /kontakt/ --code=301 2>/dev/null || echo "Redirect /pages/kontakt/ already exists"
$WP redirection create /pages/impressum/ /impressum/ --code=301 2>/dev/null || echo "Redirect /pages/impressum/ already exists"
$WP redirection create /pages/datenschutz/ /datenschutz/ --code=301 2>/dev/null || echo "Redirect /pages/datenschutz/ already exists"
$WP redirection create /pages/karriere/ /karriere/ --code=301 2>/dev/null || echo "Redirect /pages/karriere/ already exists"
$WP redirection create /pages/presse/ /presse/ --code=301 2>/dev/null || echo "Redirect /pages/presse/ already exists"
$WP redirection create /pages/speiseplan/ /speiseplan/ --code=301 2>/dev/null || echo "Redirect /pages/speiseplan/ already exists"

echo ""
echo "✅ Redirect setup complete!"
echo ""
echo "Redirect Summary:"
echo "  /pages/* → / (root level)"
echo ""
echo "To verify redirects:"
echo "  wp redirection list --allow-root"
echo ""
