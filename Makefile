# Monte-Web Makefile
# Montessorischule Gilching - Development and Deployment
#
# Usage:
#   make help              Show this help message
#   make start             Start development environment
#   make stop              Stop development environment
#   make check             Check environment health
#   make setup             Setup WordPress
#   make build             Build theme assets
#   make deploy            Deploy to production
#   make deploy-dry-run    Test deployment without changes
#   make rollback          Rollback to previous deployment
#   make security          Configure security settings

.PHONY: help start stop restart check setup build deploy deploy-dry-run rollback security clean logs

# Default target
.DEFAULT_GOAL := help

# Colors for output
GREEN := \033[0;32m
YELLOW := \033[1;33m
RED := \033[0;31m
BLUE := \033[0;34m
NC := \033[0m # No Color

# Configuration
THEME_NAME := monte-theme
LOCAL_THEME_PATH := wp-content/themes/$(THEME_NAME)
PROD_SERVER ?= user@production-server.com
PROD_PATH ?= /var/www/html
BACKUP_PATH := $(PROD_PATH)/backups
WP_PATH ?= /var/www/html
WP_USER ?= www-data
WP_GROUP ?= www-data

# Detect docker-compose command
COMPOSE_CMD := $(shell command -v docker-compose 2> /dev/null)
ifndef COMPOSE_CMD
	COMPOSE_CMD := $(shell docker compose version > /dev/null 2>&1 && echo "docker compose")
endif

#
# Help target - displays all available commands
#
help: ## Show this help message
	@echo "$(BLUE)════════════════════════════════════════════════════════════════$(NC)"
	@echo "$(BLUE)  Monte-Web Makefile - Montessorischule Gilching$(NC)"
	@echo "$(BLUE)════════════════════════════════════════════════════════════════$(NC)"
	@echo ""
	@echo "$(YELLOW)Development Commands:$(NC)"
	@echo "  $(GREEN)make start$(NC)              Start development environment"
	@echo "  $(GREEN)make stop$(NC)               Stop development environment"
	@echo "  $(GREEN)make restart$(NC)            Restart development environment"
	@echo "  $(GREEN)make check$(NC)              Check environment health"
	@echo "  $(GREEN)make setup$(NC)              Setup WordPress"
	@echo "  $(GREEN)make logs$(NC)               View container logs (Ctrl+C to exit)"
	@echo ""
	@echo "$(YELLOW)Build Commands:$(NC)"
	@echo "  $(GREEN)make build$(NC)              Build theme assets for production"
	@echo "  $(GREEN)make build-dev$(NC)          Build theme assets for development"
	@echo "  $(GREEN)make watch$(NC)              Watch and rebuild theme assets"
	@echo ""
	@echo "$(YELLOW)Deployment Commands:$(NC)"
	@echo "  $(GREEN)make deploy$(NC)             Deploy to production"
	@echo "  $(GREEN)make deploy-dry-run$(NC)     Test deployment without changes"
	@echo "  $(GREEN)make rollback$(NC)           Rollback to previous deployment"
	@echo "  $(GREEN)make security$(NC)           Configure production security settings"
	@echo ""
	@echo "$(YELLOW)Utility Commands:$(NC)"
	@echo "  $(GREEN)make clean$(NC)              Clean build artifacts"
	@echo "  $(GREEN)make wp-cli$(NC)             Access WP-CLI shell"
	@echo "  $(GREEN)make db-backup$(NC)          Backup database"
	@echo "  $(GREEN)make db-restore$(NC)         Restore database from backup"
	@echo ""
	@echo "$(YELLOW)Environment Variables:$(NC)"
	@echo "  PROD_SERVER      Production server (default: user@production-server.com)"
	@echo "  PROD_PATH        WordPress path on server (default: /var/www/html)"
	@echo "  WP_PATH          Local WordPress path (default: /var/www/html)"
	@echo "  WP_USER          WordPress user (default: www-data)"
	@echo "  WP_GROUP         WordPress group (default: www-data)"
	@echo ""

#
# Development Environment Commands
#
start: ## Start development environment
	@echo "$(BLUE)🐳 Starting Monte-Web WordPress Development Environment...$(NC)"
	@echo ""
	@if ! docker info > /dev/null 2>&1; then \
		echo "$(RED)❌ Docker is not running. Please start Docker Desktop and try again.$(NC)"; \
		exit 1; \
	fi
	@if [ -z "$(COMPOSE_CMD)" ]; then \
		echo "$(RED)❌ Neither 'docker-compose' nor 'docker compose' found.$(NC)"; \
		echo "   Please install Docker Compose and try again."; \
		exit 1; \
	fi
	@echo "📦 Using $(COMPOSE_CMD) to start services..."
	@$(COMPOSE_CMD) up -d
	@echo "⏳ Waiting for services to start..."
	@sleep 10
	@echo "🔍 Checking WordPress availability..."
	@if curl -s http://localhost:8080 > /dev/null; then \
		echo "$(GREEN)✅ WordPress is running at: http://localhost:8080$(NC)"; \
	else \
		echo "$(YELLOW)⚠️  WordPress may still be starting up...$(NC)"; \
		echo "   Check status with: $(COMPOSE_CMD) logs wordpress"; \
	fi
	@if curl -s http://localhost:8081 > /dev/null; then \
		echo "$(GREEN)✅ phpMyAdmin is running at: http://localhost:8081$(NC)"; \
	else \
		echo "$(YELLOW)⚠️  phpMyAdmin may still be starting up...$(NC)"; \
	fi
	@echo ""
	@echo "$(GREEN)🚀 Development environment started!$(NC)"
	@echo ""
	@echo "📋 Next steps:"
	@echo "1. Run WordPress setup: make setup"
	@echo "2. Access WordPress admin: http://localhost:8080/wp-admin/"
	@echo "3. View logs: make logs"
	@echo "4. Stop environment: make stop"
	@echo ""

stop: ## Stop development environment
	@echo "$(YELLOW)🛑 Stopping development environment...$(NC)"
	@$(COMPOSE_CMD) down
	@echo "$(GREEN)✅ Environment stopped$(NC)"

restart: ## Restart development environment
	@echo "$(YELLOW)🔄 Restarting development environment...$(NC)"
	@$(COMPOSE_CMD) restart
	@echo "$(GREEN)✅ Environment restarted$(NC)"

logs: ## View container logs
	@$(COMPOSE_CMD) logs -f

#
# Environment Health Check
#
check: ## Check environment health
	@echo "$(BLUE)🔍 Checking Monte-Web Development Environment...$(NC)"
	@echo ""
	@if ! docker info > /dev/null 2>&1; then \
		echo "$(RED)❌ Docker is not running$(NC)"; \
		exit 1; \
	fi
	@if [ -z "$(COMPOSE_CMD)" ]; then \
		echo "$(RED)❌ Docker Compose not found$(NC)"; \
		exit 1; \
	fi
	@echo "📦 Container Status:"
	@$(COMPOSE_CMD) ps
	@echo ""
	@echo "🌐 Service Availability:"
	@if curl -s --max-time 5 http://localhost:8080 > /dev/null; then \
		echo "$(GREEN)✅ WordPress: http://localhost:8080$(NC)"; \
	else \
		echo "$(RED)❌ WordPress: Not responding$(NC)"; \
	fi
	@if curl -s --max-time 5 http://localhost:8080/wp-admin/ > /dev/null; then \
		echo "$(GREEN)✅ WordPress Admin: http://localhost:8080/wp-admin/$(NC)"; \
	else \
		echo "$(RED)❌ WordPress Admin: Not responding$(NC)"; \
	fi
	@if curl -s --max-time 5 http://localhost:8081 > /dev/null; then \
		echo "$(GREEN)✅ phpMyAdmin: http://localhost:8081$(NC)"; \
	else \
		echo "$(RED)❌ phpMyAdmin: Not responding$(NC)"; \
	fi
	@echo ""
	@echo "💾 Volume Status:"
	@echo "WordPress Content: $$(ls -la wp-content/ 2>/dev/null | wc -l || echo 0) items"
	@echo "Uploads: $$(ls -la uploads/ 2>/dev/null | wc -l || echo 0) items"
	@echo ""
	@echo "🗄️ Database Status:"
	@if $(COMPOSE_CMD) exec -T db mysql -uwordpress -pwordpress -e "SELECT 1;" wordpress > /dev/null 2>&1; then \
		echo "$(GREEN)✅ MySQL: Connected$(NC)"; \
	else \
		echo "$(RED)❌ MySQL: Connection failed$(NC)"; \
	fi
	@echo ""
	@echo "📋 Useful Commands:"
	@echo "View logs: make logs"
	@echo "Access WP-CLI: make wp-cli"
	@echo "Stop environment: make stop"
	@echo "Restart service: make restart"

#
# WordPress Setup
#
setup: ## Setup WordPress
	@echo "$(BLUE)🚀 Setting up WordPress for Monte-Web migration...$(NC)"
	@echo ""
	@echo "⏳ Waiting for database..."
	@until $(COMPOSE_CMD) exec -T db mysqladmin ping -h localhost --silent 2>/dev/null; do \
		echo "Database is unavailable - sleeping"; \
		sleep 2; \
	done
	@echo "$(GREEN)✅ Database is ready!$(NC)"
	@echo ""
	@echo "📦 Installing WordPress..."
	@$(COMPOSE_CMD) exec -T wordpress wp core install \
		--url="http://localhost:8080" \
		--title="Montessorischule Gilching" \
		--admin_user="admin" \
		--admin_password="admin" \
		--admin_email="admin@montessorischule-gilching.de" \
		--skip-email \
		--allow-root
	@echo ""
	@echo "🇩🇪 Installing German language..."
	@$(COMPOSE_CMD) exec -T wordpress wp language core install de_DE --activate --allow-root
	@$(COMPOSE_CMD) exec -T wordpress wp site switch-language de_DE --allow-root
	@echo ""
	@echo "📦 Installing essential plugins..."
	@echo "✅ No plugins to install - using only core WordPress features"
	@echo ""
	@echo "🌍 Installing German translations..."
	@$(COMPOSE_CMD) exec -T wordpress wp language plugin install --all de_DE --allow-root
	@echo ""
	@echo "🔗 Configuring permalinks..."
	@$(COMPOSE_CMD) exec -T wordpress wp rewrite structure '/%postname%/' --allow-root
	@$(COMPOSE_CMD) exec -T wordpress wp rewrite flush --allow-root
	@echo ""
	@echo "⏰ Configuring timezone..."
	@$(COMPOSE_CMD) exec -T wordpress wp option update timezone_string 'Europe/Berlin' --allow-root
	@echo ""
	@echo "🗣️ Configuring language settings..."
	@$(COMPOSE_CMD) exec -T wordpress wp option update WPLANG 'de_DE' --allow-root
	@echo ""
	@echo "$(GREEN)✅ WordPress setup complete!$(NC)"
	@echo ""
	@echo "🌐 WordPress is now available at: http://localhost:8080"
	@echo "🔐 Admin panel: http://localhost:8080/wp-admin"
	@echo "👤 Admin login: admin / admin"
	@echo "🗄️ phpMyAdmin: http://localhost:8081"
	@echo ""
	@echo "📝 Next steps:"
	@echo "1. Access WordPress admin"
	@echo "2. Begin theme development (Phase 4)"
	@echo "3. Start content migration (Phase 3)"

#
# Build Commands
#
build: ## Build theme assets for production
	@echo "$(BLUE)🏗️  Building production assets...$(NC)"
	@if [ ! -d "$(LOCAL_THEME_PATH)" ]; then \
		echo "$(RED)❌ Theme directory not found: $(LOCAL_THEME_PATH)$(NC)"; \
		exit 1; \
	fi
	@cd $(LOCAL_THEME_PATH) && \
		if [ ! -f "package.json" ]; then \
			echo "$(RED)❌ package.json not found in theme directory$(NC)"; \
			exit 1; \
		fi && \
		if [ ! -d "node_modules" ]; then \
			echo "Installing dependencies..."; \
			npm install; \
		fi && \
		echo "Building CSS and JavaScript..." && \
		npm run build
	@echo "$(GREEN)✓ Assets built successfully$(NC)"

build-dev: ## Build theme assets for development
	@echo "$(BLUE)🏗️  Building development assets...$(NC)"
	@cd $(LOCAL_THEME_PATH) && npm run dev
	@echo "$(GREEN)✓ Development assets built$(NC)"

watch: ## Watch and rebuild theme assets
	@echo "$(BLUE)👀 Watching for changes...$(NC)"
	@cd $(LOCAL_THEME_PATH) && npm run watch

#
# Deployment Commands
#
deploy: ## Deploy to production
	@$(MAKE) _deploy DRY_RUN=false

deploy-dry-run: ## Test deployment without changes
	@$(MAKE) _deploy DRY_RUN=true

_deploy:
	@echo "$(BLUE)═══════════════════════════════════════════════════════════$(NC)"
	@echo "$(BLUE)  Monte-Web Production Deployment$(NC)"
	@echo "$(BLUE)  Montessorischule Gilching$(NC)"
	@echo "$(BLUE)═══════════════════════════════════════════════════════════$(NC)"
	@echo ""
	@echo "$(YELLOW)📋 Pre-deployment checks...$(NC)"
	@echo ""
	@if [ ! -d "$(LOCAL_THEME_PATH)" ]; then \
		echo "$(RED)❌ Theme directory not found: $(LOCAL_THEME_PATH)$(NC)"; \
		exit 1; \
	fi
	@echo "$(GREEN)✓ Theme directory found$(NC)"
	@if ! ssh -o ConnectTimeout=5 $(PROD_SERVER) "echo 'Connection successful'" > /dev/null 2>&1; then \
		echo "$(RED)❌ Cannot connect to production server: $(PROD_SERVER)$(NC)"; \
		echo "  Make sure you have SSH access configured"; \
		exit 1; \
	fi
	@echo "$(GREEN)✓ Production server accessible$(NC)"
	@if [ -d "$(LOCAL_THEME_PATH)/node_modules" ]; then \
		echo "$(YELLOW)⚠ node_modules found - it will be excluded from deployment$(NC)"; \
	fi
	@echo ""
	@$(MAKE) build
	@echo ""
	@TIMESTAMP=$$(date +%Y%m%d-%H%M%S) && \
	BACKUP_FILE="theme-$$TIMESTAMP.tar.gz" && \
	echo "$(YELLOW)📦 Creating backup...$(NC)" && \
	if [ "$(DRY_RUN)" = "true" ]; then \
		echo "$(BLUE)[DRY RUN] Would create backup: $$BACKUP_FILE$(NC)"; \
	else \
		ssh $(PROD_SERVER) "mkdir -p $(BACKUP_PATH)" && \
		ssh $(PROD_SERVER) "cd $(PROD_PATH) && tar -czf $(BACKUP_PATH)/$$BACKUP_FILE wp-content/themes/$(THEME_NAME) 2>/dev/null || echo 'No existing theme to backup'" && \
		echo "$(GREEN)✓ Backup created: $$BACKUP_FILE$(NC)"; \
	fi && \
	echo "" && \
	echo "$(YELLOW)📤 Deployment summary:$(NC)" && \
	echo "  Source: $(LOCAL_THEME_PATH)" && \
	echo "  Destination: $(PROD_SERVER):$(PROD_PATH)/wp-content/themes/$(THEME_NAME)" && \
	echo "  Backup: $$BACKUP_FILE" && \
	echo "" && \
	if [ "$(DRY_RUN)" = "false" ]; then \
		read -p "Continue with deployment? (y/N) " -n 1 -r && echo && \
		if [[ ! $$REPLY =~ ^[Yy]$$ ]]; then \
			echo "$(YELLOW)Deployment cancelled$(NC)"; \
			exit 0; \
		fi; \
	fi && \
	echo "" && \
	echo "$(YELLOW)🚀 Deploying to production...$(NC)" && \
	RSYNC_OPTS="-avz --delete" && \
	RSYNC_OPTS="$$RSYNC_OPTS --exclude 'node_modules'" && \
	RSYNC_OPTS="$$RSYNC_OPTS --exclude '.git'" && \
	RSYNC_OPTS="$$RSYNC_OPTS --exclude '.DS_Store'" && \
	RSYNC_OPTS="$$RSYNC_OPTS --exclude '*.log'" && \
	RSYNC_OPTS="$$RSYNC_OPTS --exclude 'package-lock.json'" && \
	RSYNC_OPTS="$$RSYNC_OPTS --exclude 'npm-debug.log'" && \
	if [ "$(DRY_RUN)" = "true" ]; then \
		RSYNC_OPTS="$$RSYNC_OPTS --dry-run" && \
		echo "$(BLUE)[DRY RUN] Would execute:$(NC)"; \
	fi && \
	echo "Deploying theme files..." && \
	rsync $$RSYNC_OPTS \
		$(LOCAL_THEME_PATH)/ \
		$(PROD_SERVER):$(PROD_PATH)/wp-content/themes/$(THEME_NAME)/ && \
	if [ "$(DRY_RUN)" = "false" ]; then \
		echo "$(GREEN)✓ Theme files deployed$(NC)" && \
		echo "" && \
		echo "$(YELLOW)🔧 Running post-deployment tasks...$(NC)" && \
		echo "Flushing WordPress rewrite rules..." && \
		ssh $(PROD_SERVER) "cd $(PROD_PATH) && wp rewrite flush --allow-root" 2>/dev/null || echo "⚠ Could not flush rewrites (wp-cli may not be available)" && \
		echo "Clearing WordPress cache..." && \
		ssh $(PROD_SERVER) "cd $(PROD_PATH) && wp cache flush --allow-root" 2>/dev/null || echo "⚠ Could not flush cache (wp-cli may not be available)" && \
		echo "Setting file permissions..." && \
		ssh $(PROD_SERVER) "cd $(PROD_PATH) && find wp-content/themes/$(THEME_NAME) -type f -exec chmod 644 {} \; && find wp-content/themes/$(THEME_NAME) -type d -exec chmod 755 {} \;" && \
		echo "$(GREEN)✓ Post-deployment tasks completed$(NC)"; \
	fi && \
	echo "" && \
	echo "$(GREEN)═══════════════════════════════════════════════════════════$(NC)" && \
	if [ "$(DRY_RUN)" = "true" ]; then \
		echo "$(BLUE)✅ Dry run completed successfully!$(NC)" && \
		echo "" && \
		echo "No changes were made. Run 'make deploy' to deploy."; \
	else \
		echo "$(GREEN)✅ Deployment completed successfully!$(NC)" && \
		echo "" && \
		echo "Deployed: $$TIMESTAMP" && \
		echo "Backup: $$BACKUP_FILE" && \
		echo "" && \
		echo "Next steps:" && \
		echo "  1. Visit your site and verify everything works" && \
		echo "  2. Check for any errors in WordPress debug.log" && \
		echo "  3. Test critical functionality (forms, navigation, etc.)" && \
		echo "  4. If issues occur, run: make rollback" && \
		echo "" && \
		echo "$(YELLOW)🧹 Cleaning old backups (keeping last 5)...$(NC)" && \
		ssh $(PROD_SERVER) "cd $(BACKUP_PATH) && ls -t theme-*.tar.gz | tail -n +6 | xargs -r rm" 2>/dev/null || true && \
		echo "$(GREEN)✓ Cleanup complete$(NC)"; \
	fi && \
	echo "$(GREEN)═══════════════════════════════════════════════════════════$(NC)" && \
	echo ""

rollback: ## Rollback to previous deployment
	@echo "$(YELLOW)🔄 Rolling back to previous deployment...$(NC)"
	@echo ""
	@LATEST_BACKUP=$$(ssh $(PROD_SERVER) "ls -t $(BACKUP_PATH)/theme-*.tar.gz | head -1" 2>/dev/null || echo "") && \
	if [ -z "$$LATEST_BACKUP" ]; then \
		echo "$(RED)❌ No backup found for rollback$(NC)"; \
		exit 1; \
	fi && \
	echo "Latest backup: $$LATEST_BACKUP" && \
	read -p "Continue with rollback? (y/N) " -n 1 -r && echo && \
	if [[ ! $$REPLY =~ ^[Yy]$$ ]]; then \
		echo "$(YELLOW)Rollback cancelled$(NC)"; \
		exit 0; \
	fi && \
	ssh $(PROD_SERVER) "cd $(PROD_PATH) && tar -xzf $$LATEST_BACKUP" && \
	echo "$(GREEN)✅ Rollback complete!$(NC)"

#
# Security Configuration
#
security: ## Configure production security settings
	@echo "$(BLUE)🔒 Configuring WordPress security settings...$(NC)"
	@echo ""
	@echo "$(YELLOW)WordPress Path: $(WP_PATH)$(NC)"
	@echo "$(YELLOW)WordPress User: $(WP_USER)$(NC)"
	@echo "$(YELLOW)WordPress Group: $(WP_GROUP)$(NC)"
	@echo ""
	@if [ $$(id -u) -ne 0 ]; then \
		echo "$(RED)This command must be run as root or with sudo$(NC)"; \
		echo "Run: sudo make security"; \
		exit 1; \
	fi
	@if [ ! -d "$(WP_PATH)" ]; then \
		echo "$(RED)Error: WordPress directory not found at $(WP_PATH)$(NC)"; \
		exit 1; \
	fi
	@echo "Step 1: Setting ownership..."
	@chown -R $(WP_USER):$(WP_GROUP) $(WP_PATH)
	@echo "$(GREEN)✓ Ownership set to $(WP_USER):$(WP_GROUP)$(NC)"
	@echo ""
	@echo "Step 2: Setting directory permissions (755)..."
	@find $(WP_PATH) -type d -exec chmod 755 {} \;
	@echo "$(GREEN)✓ Directory permissions set to 755$(NC)"
	@echo ""
	@echo "Step 3: Setting file permissions (644)..."
	@find $(WP_PATH) -type f -exec chmod 644 {} \;
	@echo "$(GREEN)✓ File permissions set to 644$(NC)"
	@echo ""
	@echo "Step 4: Securing wp-config.php..."
	@if [ -f "$(WP_PATH)/wp-config.php" ]; then \
		chmod 600 $(WP_PATH)/wp-config.php && \
		echo "$(GREEN)✓ wp-config.php secured (permissions: 600)$(NC)"; \
	else \
		echo "$(YELLOW)⚠ wp-config.php not found$(NC)"; \
	fi
	@echo ""
	@echo "Step 5: Securing .htaccess..."
	@if [ -f "$(WP_PATH)/.htaccess" ]; then \
		chmod 644 $(WP_PATH)/.htaccess && \
		echo "$(GREEN)✓ .htaccess secured (permissions: 644)$(NC)"; \
	else \
		echo "$(YELLOW)⚠ .htaccess not found (will be created by WordPress)$(NC)"; \
	fi
	@echo ""
	@echo "Step 6: Setting uploads directory permissions..."
	@if [ -d "$(WP_PATH)/wp-content/uploads" ]; then \
		chmod -R 755 $(WP_PATH)/wp-content/uploads && \
		echo "$(GREEN)✓ Uploads directory permissions set to 755$(NC)"; \
	else \
		echo "$(YELLOW)⚠ Uploads directory not found$(NC)"; \
	fi
	@echo ""
	@echo "Step 7: Protecting sensitive files..."
	@echo '# Deny access to sensitive files' > $(WP_PATH)/wp-content/.htaccess
	@echo '<Files wp-config.php>' >> $(WP_PATH)/wp-content/.htaccess
	@echo '    Order allow,deny' >> $(WP_PATH)/wp-content/.htaccess
	@echo '    Deny from all' >> $(WP_PATH)/wp-content/.htaccess
	@echo '</Files>' >> $(WP_PATH)/wp-content/.htaccess
	@echo '' >> $(WP_PATH)/wp-content/.htaccess
	@echo '<Files .htaccess>' >> $(WP_PATH)/wp-content/.htaccess
	@echo '    Order allow,deny' >> $(WP_PATH)/wp-content/.htaccess
	@echo '    Deny from all' >> $(WP_PATH)/wp-content/.htaccess
	@echo '</Files>' >> $(WP_PATH)/wp-content/.htaccess
	@echo '' >> $(WP_PATH)/wp-content/.htaccess
	@echo '# Protect debug.log' >> $(WP_PATH)/wp-content/.htaccess
	@echo '<Files debug.log>' >> $(WP_PATH)/wp-content/.htaccess
	@echo '    Order allow,deny' >> $(WP_PATH)/wp-content/.htaccess
	@echo '    Deny from all' >> $(WP_PATH)/wp-content/.htaccess
	@echo '</Files>' >> $(WP_PATH)/wp-content/.htaccess
	@echo '' >> $(WP_PATH)/wp-content/.htaccess
	@echo '# Protect install.php and upgrade.php' >> $(WP_PATH)/wp-content/.htaccess
	@echo '<FilesMatch "^(install|upgrade)\.php$$">' >> $(WP_PATH)/wp-content/.htaccess
	@echo '    Order allow,deny' >> $(WP_PATH)/wp-content/.htaccess
	@echo '    Deny from all' >> $(WP_PATH)/wp-content/.htaccess
	@echo '</FilesMatch>' >> $(WP_PATH)/wp-content/.htaccess
	@chmod 644 $(WP_PATH)/wp-content/.htaccess
	@echo "$(GREEN)✓ Created .htaccess in wp-content$(NC)"
	@echo ""
	@echo "Step 8: Verifying critical file permissions..."
	@echo "Checking critical files:"
	@echo "  wp-config.php: $$(stat -c '%a' $(WP_PATH)/wp-config.php 2>/dev/null || echo 'Not found')"
	@echo "  wp-content/: $$(stat -c '%a' $(WP_PATH)/wp-content 2>/dev/null || echo 'Not found')"
	@echo "  wp-content/uploads/: $$(stat -c '%a' $(WP_PATH)/wp-content/uploads 2>/dev/null || echo 'Not found')"
	@echo ""
	@echo "$(GREEN)✅ Security configuration complete!$(NC)"
	@echo ""
	@echo "Additional security recommendations:"
	@echo "  1. Change all default passwords (admin, database)"
	@echo "  2. Install a security plugin (Wordfence or Sucuri)"
	@echo "  3. Enable SSL/HTTPS with Let's Encrypt"
	@echo "  4. Set up automated backups"
	@echo "  5. Configure firewall rules"
	@echo "  6. Disable XML-RPC if not needed"
	@echo "  7. Limit login attempts"
	@echo "  8. Keep WordPress, themes, and plugins updated"
	@echo ""

#
# Utility Commands
#
clean: ## Clean build artifacts
	@echo "$(YELLOW)🧹 Cleaning build artifacts...$(NC)"
	@if [ -d "$(LOCAL_THEME_PATH)/node_modules" ]; then \
		rm -rf $(LOCAL_THEME_PATH)/node_modules && \
		echo "$(GREEN)✓ Removed node_modules$(NC)"; \
	fi
	@if [ -d "$(LOCAL_THEME_PATH)/dist" ]; then \
		rm -rf $(LOCAL_THEME_PATH)/dist && \
		echo "$(GREEN)✓ Removed dist$(NC)"; \
	fi
	@echo "$(GREEN)✅ Clean complete$(NC)"

wp-cli: ## Access WP-CLI shell
	@$(COMPOSE_CMD) exec wordpress wp shell --allow-root

db-backup: ## Backup database
	@echo "$(YELLOW)💾 Backing up database...$(NC)"
	@TIMESTAMP=$$(date +%Y%m%d-%H%M%S) && \
	$(COMPOSE_CMD) exec -T db mysqldump -uwordpress -pwordpress wordpress > backup-$$TIMESTAMP.sql && \
	echo "$(GREEN)✅ Database backed up to: backup-$$TIMESTAMP.sql$(NC)"

db-restore: ## Restore database from backup
	@echo "$(YELLOW)💾 Restoring database...$(NC)"
	@if [ -z "$(FILE)" ]; then \
		echo "$(RED)❌ Please specify backup file: make db-restore FILE=backup.sql$(NC)"; \
		exit 1; \
	fi
	@if [ ! -f "$(FILE)" ]; then \
		echo "$(RED)❌ Backup file not found: $(FILE)$(NC)"; \
		exit 1; \
	fi
	@$(COMPOSE_CMD) exec -T db mysql -uwordpress -pwordpress wordpress < $(FILE)
	@echo "$(GREEN)✅ Database restored from: $(FILE)$(NC)"
