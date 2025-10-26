#!/bin/bash

# Environment Health Check Script
# This script checks if all services are running properly

echo "🔍 Checking Monte-Web Development Environment..."
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running"
    exit 1
fi

# Determine compose command
if command -v docker-compose &> /dev/null; then
    COMPOSE_CMD="docker-compose"
elif docker compose version &> /dev/null; then
    COMPOSE_CMD="docker compose"
else
    echo "❌ Docker Compose not found"
    exit 1
fi

# Check container status
echo "📦 Container Status:"
$COMPOSE_CMD ps

echo ""
echo "🌐 Service Availability:"

# Check WordPress
if curl -s --max-time 5 http://localhost:8080 > /dev/null; then
    echo "✅ WordPress: http://localhost:8080"
else
    echo "❌ WordPress: Not responding"
fi

# Check WordPress Admin
if curl -s --max-time 5 http://localhost:8080/wp-admin/ > /dev/null; then
    echo "✅ WordPress Admin: http://localhost:8080/wp-admin/"
else
    echo "❌ WordPress Admin: Not responding"
fi

# Check phpMyAdmin
if curl -s --max-time 5 http://localhost:8081 > /dev/null; then
    echo "✅ phpMyAdmin: http://localhost:8081"
else
    echo "❌ phpMyAdmin: Not responding"
fi

echo ""
echo "💾 Volume Status:"
echo "WordPress Content: $(ls -la wp-content/ | wc -l) items"
echo "Uploads: $(ls -la uploads/ 2>/dev/null | wc -l 2>/dev/null || echo 0) items"

echo ""
echo "🗄️ Database Status:"
# Check if MySQL is accessible
if $COMPOSE_CMD exec -T db mysql -uwordpress -pwordpress -e "SELECT 1;" wordpress > /dev/null 2>&1; then
    echo "✅ MySQL: Connected"
else
    echo "❌ MySQL: Connection failed"
fi

echo ""
echo "📋 Useful Commands:"
echo "View logs: $COMPOSE_CMD logs -f [service]"
echo "Access WP-CLI: $COMPOSE_CMD exec wordpress wp"
echo "Stop environment: $COMPOSE_CMD down"
echo "Restart service: $COMPOSE_CMD restart [service]"