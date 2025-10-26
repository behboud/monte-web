#!/bin/bash
# Monte-Web Production Deployment Script
# Montessorischule Gilching - WordPress Deployment
# 
# This script handles deployment from local/staging to production server
# 
# Usage:
#   ./deploy.sh              - Deploy to production
#   ./deploy.sh --dry-run    - Test deployment without making changes
#   ./deploy.sh --rollback   - Rollback to previous deployment

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration - Update these for your production environment
PROD_SERVER="${PROD_SERVER:-user@production-server.com}"
PROD_PATH="${PROD_PATH:-/var/www/html}"
THEME_NAME="monte-theme"
LOCAL_THEME_PATH="wp-content/themes/${THEME_NAME}"
BACKUP_PATH="${PROD_PATH}/backups"

# Check for flags
DRY_RUN=false
ROLLBACK=false

for arg in "$@"; do
    case $arg in
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --rollback)
            ROLLBACK=true
            shift
            ;;
        --help)
            echo "Monte-Web Deployment Script"
            echo ""
            echo "Usage:"
            echo "  ./deploy.sh              Deploy to production"
            echo "  ./deploy.sh --dry-run    Test deployment without changes"
            echo "  ./deploy.sh --rollback   Rollback to previous deployment"
            echo ""
            echo "Environment variables:"
            echo "  PROD_SERVER   Production server (default: user@production-server.com)"
            echo "  PROD_PATH     WordPress path on server (default: /var/www/html)"
            exit 0
            ;;
    esac
done

echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  Monte-Web Production Deployment${NC}"
echo -e "${BLUE}  Montessorischule Gilching${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""

# Handle rollback
if [ "$ROLLBACK" = true ]; then
    echo -e "${YELLOW}🔄 Rolling back to previous deployment...${NC}"
    echo ""
    
    # Get latest backup
    LATEST_BACKUP=$(ssh ${PROD_SERVER} "ls -t ${BACKUP_PATH}/theme-*.tar.gz | head -1" 2>/dev/null || echo "")
    
    if [ -z "$LATEST_BACKUP" ]; then
        echo -e "${RED}❌ No backup found for rollback${NC}"
        exit 1
    fi
    
    echo -e "Latest backup: ${LATEST_BACKUP}"
    read -p "Continue with rollback? (y/N) " -n 1 -r
    echo
    
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}Rollback cancelled${NC}"
        exit 0
    fi
    
    # Restore backup
    ssh ${PROD_SERVER} "cd ${PROD_PATH} && tar -xzf ${LATEST_BACKUP}"
    
    echo -e "${GREEN}✅ Rollback complete!${NC}"
    exit 0
fi

# Pre-deployment checks
echo -e "${YELLOW}📋 Pre-deployment checks...${NC}"
echo ""

# Check if theme directory exists
if [ ! -d "$LOCAL_THEME_PATH" ]; then
    echo -e "${RED}❌ Theme directory not found: ${LOCAL_THEME_PATH}${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Theme directory found${NC}"

# Check if production server is reachable
if ! ssh -o ConnectTimeout=5 ${PROD_SERVER} "echo 'Connection successful'" > /dev/null 2>&1; then
    echo -e "${RED}❌ Cannot connect to production server: ${PROD_SERVER}${NC}"
    echo "  Make sure you have SSH access configured"
    exit 1
fi
echo -e "${GREEN}✓ Production server accessible${NC}"

# Check if node_modules exists (it shouldn't be deployed)
if [ -d "${LOCAL_THEME_PATH}/node_modules" ]; then
    echo -e "${YELLOW}⚠ node_modules found - it will be excluded from deployment${NC}"
fi

echo ""

# Build assets
echo -e "${YELLOW}🏗️  Building production assets...${NC}"
cd ${LOCAL_THEME_PATH}

if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ package.json not found in theme directory${NC}"
    exit 1
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

# Build for production
echo "Building CSS and JavaScript..."
npm run build

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Build failed${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Assets built successfully${NC}"

cd ../../..
echo ""

# Create backup
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BACKUP_FILE="theme-${TIMESTAMP}.tar.gz"

echo -e "${YELLOW}📦 Creating backup...${NC}"

if [ "$DRY_RUN" = true ]; then
    echo -e "${BLUE}[DRY RUN] Would create backup: ${BACKUP_FILE}${NC}"
else
    # Create backup directory on server if it doesn't exist
    ssh ${PROD_SERVER} "mkdir -p ${BACKUP_PATH}"
    
    # Backup current theme on server
    ssh ${PROD_SERVER} "cd ${PROD_PATH} && tar -czf ${BACKUP_PATH}/${BACKUP_FILE} wp-content/themes/${THEME_NAME} 2>/dev/null || echo 'No existing theme to backup'"
    
    echo -e "${GREEN}✓ Backup created: ${BACKUP_FILE}${NC}"
fi

echo ""

# Display what will be deployed
echo -e "${YELLOW}📤 Deployment summary:${NC}"
echo "  Source: ${LOCAL_THEME_PATH}"
echo "  Destination: ${PROD_SERVER}:${PROD_PATH}/wp-content/themes/${THEME_NAME}"
echo "  Backup: ${BACKUP_FILE}"
echo ""

if [ "$DRY_RUN" = false ]; then
    read -p "Continue with deployment? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}Deployment cancelled${NC}"
        exit 0
    fi
fi

echo ""
echo -e "${YELLOW}🚀 Deploying to production...${NC}"

# Rsync options
RSYNC_OPTS="-avz --delete"
RSYNC_OPTS="${RSYNC_OPTS} --exclude 'node_modules'"
RSYNC_OPTS="${RSYNC_OPTS} --exclude '.git'"
RSYNC_OPTS="${RSYNC_OPTS} --exclude '.DS_Store'"
RSYNC_OPTS="${RSYNC_OPTS} --exclude '*.log'"
RSYNC_OPTS="${RSYNC_OPTS} --exclude 'package-lock.json'"
RSYNC_OPTS="${RSYNC_OPTS} --exclude 'npm-debug.log'"

if [ "$DRY_RUN" = true ]; then
    RSYNC_OPTS="${RSYNC_OPTS} --dry-run"
    echo -e "${BLUE}[DRY RUN] Would execute:${NC}"
fi

# Deploy theme files
echo "Deploying theme files..."
rsync ${RSYNC_OPTS} \
    ${LOCAL_THEME_PATH}/ \
    ${PROD_SERVER}:${PROD_PATH}/wp-content/themes/${THEME_NAME}/

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Deployment failed${NC}"
    exit 1
fi

if [ "$DRY_RUN" = false ]; then
    echo -e "${GREEN}✓ Theme files deployed${NC}"
fi

echo ""

# Post-deployment tasks
if [ "$DRY_RUN" = false ]; then
    echo -e "${YELLOW}🔧 Running post-deployment tasks...${NC}"
    
    # Flush rewrite rules
    echo "Flushing WordPress rewrite rules..."
    ssh ${PROD_SERVER} "cd ${PROD_PATH} && wp rewrite flush --allow-root" 2>/dev/null || echo "⚠ Could not flush rewrites (wp-cli may not be available)"
    
    # Clear cache if caching plugin is installed
    echo "Clearing WordPress cache..."
    ssh ${PROD_SERVER} "cd ${PROD_PATH} && wp cache flush --allow-root" 2>/dev/null || echo "⚠ Could not flush cache (wp-cli may not be available)"
    
    # Set proper permissions
    echo "Setting file permissions..."
    ssh ${PROD_SERVER} "cd ${PROD_PATH} && find wp-content/themes/${THEME_NAME} -type f -exec chmod 644 {} \; && find wp-content/themes/${THEME_NAME} -type d -exec chmod 755 {} \;"
    
    echo -e "${GREEN}✓ Post-deployment tasks completed${NC}"
fi

echo ""

# Summary
echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
if [ "$DRY_RUN" = true ]; then
    echo -e "${BLUE}✅ Dry run completed successfully!${NC}"
    echo ""
    echo "No changes were made. Run without --dry-run to deploy."
else
    echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
    echo ""
    echo "Deployed: ${TIMESTAMP}"
    echo "Backup: ${BACKUP_FILE}"
    echo ""
    echo "Next steps:"
    echo "  1. Visit your site and verify everything works"
    echo "  2. Check for any errors in WordPress debug.log"
    echo "  3. Test critical functionality (forms, navigation, etc.)"
    echo "  4. If issues occur, run: ./deploy.sh --rollback"
fi
echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
echo ""

# Keep only last 5 backups
if [ "$DRY_RUN" = false ]; then
    echo -e "${YELLOW}🧹 Cleaning old backups (keeping last 5)...${NC}"
    ssh ${PROD_SERVER} "cd ${BACKUP_PATH} && ls -t theme-*.tar.gz | tail -n +6 | xargs -r rm" 2>/dev/null || true
    echo -e "${GREEN}✓ Cleanup complete${NC}"
fi

echo ""
echo "Deployment log saved to: deployment-${TIMESTAMP}.log"
