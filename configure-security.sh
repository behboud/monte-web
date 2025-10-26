#!/bin/bash
# Monte-Web Security Configuration Script
# Sets proper file permissions for WordPress installation
# Run this script on production server after deployment

set -e

echo "🔒 Configuring WordPress security settings..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
WP_PATH="${WP_PATH:-/var/www/html}"
WP_USER="${WP_USER:-www-data}"
WP_GROUP="${WP_GROUP:-www-data}"

echo -e "${YELLOW}WordPress Path: ${WP_PATH}${NC}"
echo -e "${YELLOW}WordPress User: ${WP_USER}${NC}"
echo -e "${YELLOW}WordPress Group: ${WP_GROUP}${NC}"
echo ""

# Check if running as root or with sudo
if [[ $EUID -ne 0 ]]; then
   echo -e "${RED}This script must be run as root or with sudo${NC}"
   exit 1
fi

# Check if WordPress directory exists
if [ ! -d "$WP_PATH" ]; then
    echo -e "${RED}Error: WordPress directory not found at ${WP_PATH}${NC}"
    exit 1
fi

echo "Step 1: Setting ownership..."
# Set ownership to web server user
chown -R ${WP_USER}:${WP_GROUP} ${WP_PATH}
echo -e "${GREEN}✓ Ownership set to ${WP_USER}:${WP_GROUP}${NC}"

echo ""
echo "Step 2: Setting directory permissions (755)..."
# Set directory permissions
find ${WP_PATH} -type d -exec chmod 755 {} \;
echo -e "${GREEN}✓ Directory permissions set to 755${NC}"

echo ""
echo "Step 3: Setting file permissions (644)..."
# Set file permissions
find ${WP_PATH} -type f -exec chmod 644 {} \;
echo -e "${GREEN}✓ File permissions set to 644${NC}"

echo ""
echo "Step 4: Securing wp-config.php..."
# Secure wp-config.php (read/write for owner only)
if [ -f "${WP_PATH}/wp-config.php" ]; then
    chmod 600 ${WP_PATH}/wp-config.php
    echo -e "${GREEN}✓ wp-config.php secured (permissions: 600)${NC}"
else
    echo -e "${YELLOW}⚠ wp-config.php not found${NC}"
fi

echo ""
echo "Step 5: Securing .htaccess..."
# Secure .htaccess
if [ -f "${WP_PATH}/.htaccess" ]; then
    chmod 644 ${WP_PATH}/.htaccess
    echo -e "${GREEN}✓ .htaccess secured (permissions: 644)${NC}"
else
    echo -e "${YELLOW}⚠ .htaccess not found (will be created by WordPress)${NC}"
fi

echo ""
echo "Step 6: Setting uploads directory permissions..."
# Uploads directory needs write permissions
if [ -d "${WP_PATH}/wp-content/uploads" ]; then
    chmod -R 755 ${WP_PATH}/wp-content/uploads
    echo -e "${GREEN}✓ Uploads directory permissions set to 755${NC}"
else
    echo -e "${YELLOW}⚠ Uploads directory not found${NC}"
fi

echo ""
echo "Step 7: Protecting sensitive files..."
# Create .htaccess in wp-content to protect sensitive files
cat > ${WP_PATH}/wp-content/.htaccess << 'EOF'
# Deny access to sensitive files
<Files wp-config.php>
    Order allow,deny
    Deny from all
</Files>

<Files .htaccess>
    Order allow,deny
    Deny from all
</Files>

# Protect debug.log
<Files debug.log>
    Order allow,deny
    Deny from all
</Files>

# Protect install.php and upgrade.php
<FilesMatch "^(install|upgrade)\.php$">
    Order allow,deny
    Deny from all
</FilesMatch>
EOF

chmod 644 ${WP_PATH}/wp-content/.htaccess
echo -e "${GREEN}✓ Created .htaccess in wp-content${NC}"

echo ""
echo "Step 8: Verifying critical file permissions..."
# Verify permissions
echo "Checking critical files:"
echo "  wp-config.php: $(stat -c '%a' ${WP_PATH}/wp-config.php 2>/dev/null || echo 'Not found')"
echo "  wp-content/: $(stat -c '%a' ${WP_PATH}/wp-content 2>/dev/null || echo 'Not found')"
echo "  wp-content/uploads/: $(stat -c '%a' ${WP_PATH}/wp-content/uploads 2>/dev/null || echo 'Not found')"

echo ""
echo -e "${GREEN}✅ Security configuration complete!${NC}"
echo ""
echo "Additional security recommendations:"
echo "  1. Change all default passwords (admin, database)"
echo "  2. Install a security plugin (Wordfence or Sucuri)"
echo "  3. Enable SSL/HTTPS with Let's Encrypt"
echo "  4. Set up automated backups"
echo "  5. Configure firewall rules"
echo "  6. Disable XML-RPC if not needed"
echo "  7. Limit login attempts"
echo "  8. Keep WordPress, themes, and plugins updated"
echo ""
