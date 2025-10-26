#!/bin/bash

# Hugo to WordPress Content Migration Script
# Uses WP-CLI for reliable content creation

set -e

WP_CLI="docker-compose exec -T wordpress wp --allow-root"
CONTENT_DIR="./content/de"
ASSETS_DIR="./assets/images"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Statistics
TOTAL=0
SUCCESS=0
FAILED=0
IMAGES=0

echo "🚀 Starting Hugo to WordPress Migration"
echo "========================================"
echo ""

# Upload an image and return its ID
upload_image() {
    local image_path="$1"
    local full_path="${ASSETS_DIR}/${image_path}"
    
    if [ ! -f "$full_path" ]; then
        warning "Image not found: $full_path" >&2
        echo ""
        return
    fi
    
    # Check if image already exists in WordPress
    local filename=$(basename "$image_path")
    local slug="${filename%.*}"  # Remove extension
    local existing_id=$($WP_CLI post list --post_type=attachment --name="$slug" --field=ID 2>/dev/null | head -n1)
    
    if [ -n "$existing_id" ]; then
        log "Image already exists: $filename (ID: $existing_id)" >&2
        echo "$existing_id"
        return
    fi
    
    # Copy image to WordPress uploads directory (mounted volume)
    local temp_filename="migrate-temp-$(date +%s)-$(basename "$image_path")"
    local temp_path="./wp-content/uploads/$temp_filename"
    cp "$full_path" "$temp_path" 2>/dev/null
    
    if [ $? -ne 0 ]; then
        error "Failed to copy image: $image_path" >&2
        echo ""
        return
    fi
    
    # Upload image via WP-CLI
    local media_id=$($WP_CLI media import "/var/www/html/wp-content/uploads/$temp_filename" --porcelain 2>/dev/null)
    
    # Clean up temp file
    rm "$temp_path" 2>/dev/null
    
    if [ -n "$media_id" ] && [ "$media_id" -gt 0 ] 2>/dev/null; then
        success "Uploaded image: $filename (ID: $media_id)" >&2
        echo "$media_id"
    else
        error "Failed to upload image: $image_path" >&2
        echo ""
    fi
}

# Create or get tag ID
get_or_create_tag() {
    local tag_name="$1"
    
    # Try to get existing tag
    local tag_id=$($WP_CLI term list post_tag --field=term_id --name="$tag_name" 2>/dev/null | head -n1)
    
    if [ -n "$tag_id" ]; then
        echo "$tag_id"
        return
    fi
    
    # Create new tag
    tag_id=$($WP_CLI term create post_tag "$tag_name" --porcelain 2>/dev/null)
    
    if [ -n "$tag_id" ]; then
        log "Created tag: $tag_name" >&2  # Send log to stderr to avoid polluting the return value
        echo "$tag_id"
    fi
}

# Migrate a single markdown file
migrate_file() {
    local file_path="$1"
    local post_type="$2"
    
    TOTAL=$((TOTAL + 1))
    
    local filename=$(basename "$file_path" .md)
    log "Processing: $filename"
    
    # Use Node.js to parse frontmatter and extract fields (run from content-migration dir to access node_modules)
    local json=$(cd content-migration && node -e "
        const fs = require('fs');
        const matter = require('gray-matter');
        const content = fs.readFileSync('../$file_path', 'utf8');
        const { data, content: body } = matter(content);
        console.log(JSON.stringify({
            title: data.title || 'Untitled',
            content: body.trim(),
            date: data.date || '',
            image: data.image || '',
            tags: data.tags || [],
            draft: data.draft || false
        }));
    ")
    
    local title=$(echo "$json" | node -e "process.stdin.on('data', d => console.log(JSON.parse(d).title))")
    local content=$(echo "$json" | node -e "process.stdin.on('data', d => console.log(JSON.parse(d).content))")
    local date=$(echo "$json" | node -e "process.stdin.on('data', d => console.log(JSON.parse(d).date))")
    local image=$(echo "$json" | node -e "process.stdin.on('data', d => console.log(JSON.parse(d).image))")
    local draft=$(echo "$json" | node -e "process.stdin.on('data', d => console.log(JSON.parse(d).draft))")
    
    if [ -z "$title" ] || [ "$title" = "null" ]; then
        warning "Skipping $filename - no title"
        return
    fi
    
    # Determine status
    local status="publish"
    if [ "$draft" = "true" ]; then
        status="draft"
    fi
    
    # Create post
    local cmd="$WP_CLI post create --post_type=$post_type --post_title=\"$title\" --post_content=\"$content\" --post_status=$status --post_name=$filename --porcelain"
    
    # Add date if available
    if [ -n "$date" ] && [ "$date" != "null" ] && [ "$date" != "" ]; then
        cmd="$cmd --post_date=\"$date\""
    fi
    
    # Execute post creation
    local post_id=$(eval "$cmd" 2>/dev/null)
    
    if [ -z "$post_id" ]; then
        error "Failed to create post: $title"
        FAILED=$((FAILED + 1))
        return
    fi
    
    success "Created $post_type: $title (ID: $post_id)"
    SUCCESS=$((SUCCESS + 1))
    
    # Upload and set featured image
    if [ -n "$image" ] && [ "$image" != "null" ] && [ "$image" != "" ]; then
        local clean_image=$(echo "$image" | sed 's|^/||' | sed 's|^images/||')
        local media_id=$(upload_image "$clean_image")
        
        if [ -n "$media_id" ] && [ "$media_id" -gt 0 ] 2>/dev/null; then
            $WP_CLI post meta update "$post_id" _thumbnail_id "$media_id" 2>/dev/null
            log "Set featured image for: $title"
            IMAGES=$((IMAGES + 1))
        fi
    fi
    
    # Add tags (only for news posts)
    if [ "$post_type" = "news" ]; then
        local tags=$(echo "$json" | node -e "process.stdin.on('data', d => { const tags = JSON.parse(d).tags; if (Array.isArray(tags)) console.log(tags.join(',')); })")
        
        if [ -n "$tags" ]; then
            # Build tag name arguments for wp-cli (space-separated, quoted)
            local tag_args=""
            IFS=',' read -ra TAG_ARRAY <<< "$tags"
            for tag in "${TAG_ARRAY[@]}"; do
                if [ -n "$tag" ]; then
                    # Ensure tag exists
                    get_or_create_tag "$tag" >/dev/null
                    # Add to arguments list
                    tag_args="$tag_args \"$tag\""
                fi
            done
            
            if [ -n "$tag_args" ]; then
                # Use eval to properly handle quoted arguments
                eval "$WP_CLI post term set $post_id post_tag $tag_args 2>/dev/null"
                log "Added tags to: $title"
            fi
        fi
    fi
    
    echo ""
}

# Migrate a section
migrate_section() {
    local section="$1"
    local post_type="$2"
    
    log "Migrating section: $section/ → $post_type"
    echo ""
    
    local section_dir="${CONTENT_DIR}/${section}"
    
    if [ ! -d "$section_dir" ]; then
        warning "Section directory not found: $section_dir"
        return
    fi
    
    # Find all markdown files except _index.md
    for file in "$section_dir"/*.md; do
        if [ "$(basename "$file")" != "_index.md" ]; then
            migrate_file "$file" "$post_type"
        fi
    done
}

# Main migration
log "Starting content migration..."
echo ""

# Migrate all sections
migrate_section "aktuelles" "news"
migrate_section "aufnahme" "admission"
migrate_section "spenden" "donation"
migrate_section "verein" "association"
migrate_section "schule" "pages"
migrate_section "pages" "pages"

# Print statistics
echo ""
echo "========================================"
echo "📊 Migration Statistics"
echo "========================================"
log "Total files processed: $TOTAL"
success "Successfully migrated: $SUCCESS"
error "Failed: $FAILED"
log "Images uploaded: $IMAGES"
echo "========================================"
echo ""

if [ $SUCCESS -gt 0 ]; then
    success "Migration complete! 🎉"
    echo ""
    log "Next steps:"
    echo "  1. Verify content at http://localhost:8080/wp-admin"
    echo "  2. Set homepage ACF fields manually"
    echo "  3. Check all images loaded correctly"
    echo ""
else
    error "Migration failed. Please check the errors above."
    exit 1
fi
