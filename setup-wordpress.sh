#!/bin/bash

# WordPress Setup Script for Monte-Web Migration
# This script sets up the WordPress environment with essential plugins and configuration

set -e

echo "🚀 Setting up WordPress for Monte-Web migration..."

# Wait for database to be healthy
echo "⏳ Waiting for database..."
until docker-compose exec -T db mysqladmin ping -h localhost --silent; do
    echo "Database is unavailable - sleeping"
    sleep 2
done
echo "✅ Database is ready!"

# Install WordPress core
echo "📦 Installing WordPress..."
docker-compose exec -T wordpress wp core install \
    --url="http://localhost:8080" \
    --title="Montessorischule Gilching" \
    --admin_user="admin" \
    --admin_password="admin" \
    --admin_email="admin@montessorischule-gilching.de" \
    --skip-email \
    --allow-root

# Install German language pack
echo "🇩🇪 Installing German language..."
docker-compose exec -T wordpress wp language core install de_DE --activate --allow-root
docker-compose exec -T wordpress wp site switch-language de_DE --allow-root

# Install and activate essential plugins
echo "📦 Installing essential plugins..."
docker-compose exec -T wordpress wp plugin install \
    advanced-custom-fields \
    contact-form-7 \
    wordpress-seo \
    custom-post-type-ui \
    wp-migrate-db \
    query-monitor \
    redirection \
    really-simple-csv-importer \
    --activate --allow-root

# Install German translations for plugins
echo "🌍 Installing German translations..."
docker-compose exec -T wordpress wp language plugin install --all de_DE --allow-root

# Set permalink structure to match Hugo URLs
echo "🔗 Configuring permalinks..."
docker-compose exec -T wordpress wp rewrite structure '/%postname%/' --allow-root
docker-compose exec -T wordpress wp rewrite flush --allow-root

# Configure timezone
echo "⏰ Configuring timezone..."
docker-compose exec -T wordpress wp option update timezone_string 'Europe/Berlin' --allow-root

# Configure site language
echo "🗣️ Configuring language settings..."
docker-compose exec -T wordpress wp option update WPLANG 'de_DE' --allow-root

echo ""
echo "✅ WordPress setup complete!"
echo ""
echo "🌐 WordPress is now available at: http://localhost:8080"
echo "🔐 Admin panel: http://localhost:8080/wp-admin"
echo "👤 Admin login: admin / admin"
echo "🗄️ phpMyAdmin: http://localhost:8081"
echo ""
echo "📝 Next steps:"
echo "1. Access WordPress admin"
echo "2. Begin theme development (Phase 4)"
echo "3. Start content migration (Phase 3)"
