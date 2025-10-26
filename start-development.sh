#!/bin/bash

# Development Environment Startup Script
# This script starts the WordPress development environment

set -e

echo "🐳 Starting Monte-Web WordPress Development Environment..."
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker Desktop and try again."
    echo "   After starting Docker, run: ./start-development.sh"
    exit 1
fi

# Check if docker-compose is available
if command -v docker-compose &> /dev/null; then
    COMPOSE_CMD="docker-compose"
elif docker compose version &> /dev/null; then
    COMPOSE_CMD="docker compose"
else
    echo "❌ Neither 'docker-compose' nor 'docker compose' found."
    echo "   Please install Docker Compose and try again."
    exit 1
fi

echo "📦 Using $COMPOSE_CMD to start services..."

# Start the services
$COMPOSE_CMD up -d

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 10

# Check if WordPress is responding
echo "🔍 Checking WordPress availability..."
if curl -s http://localhost:8080 > /dev/null; then
    echo "✅ WordPress is running at: http://localhost:8080"
else
    echo "⚠️  WordPress may still be starting up..."
    echo "   Check status with: $COMPOSE_CMD logs wordpress"
fi

# Check if phpMyAdmin is responding
if curl -s http://localhost:8081 > /dev/null; then
    echo "✅ phpMyAdmin is running at: http://localhost:8081"
else
    echo "⚠️  phpMyAdmin may still be starting up..."
fi

echo ""
echo "🚀 Development environment started!"
echo ""
echo "📋 Next steps:"
echo "1. Run the WordPress setup: ./setup-wordpress.sh"
echo "2. Access WordPress admin: http://localhost:8080/wp-admin/"
echo "3. View logs: $COMPOSE_CMD logs -f"
echo "4. Stop environment: $COMPOSE_CMD down"
echo ""
echo "📚 For more information, see README-WORDPRESS.md"