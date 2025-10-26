#!/bin/bash
set -e

WP_CLI="docker-compose exec -T wordpress wp --allow-root"
CONTENT_DIR="./content/de"

# Missing files to migrate (found from comparison)
declare -A MISSING_FILES=(
    ["aktuelles/2025-03-24-mitgliederversammlung-cms-2025.md"]="news"
    ["schule/elternengagement/ags-und-dienste.md"]="page"
    ["pages/datenschutz.md"]="page"
    ["schule/elternengagement/elternbeirat.md"]="page"
    ["schule/konzept/maria-montessori/grundzuege-der-paedagogik.md"]="page"
    ["schule/schulhaus/haus.md"]="page"
    ["pages/impressum.md"]="page"
    ["pages/karriere.md"]="page"
    ["schule/schulhaus/kueche.md"]="page"
    ["schule/paedagogisches-team.md"]="page"
    ["pages/presse.md"]="page"
    ["schule/konzept/qualitaeten.md"]="page"
    ["schule/schulhaus/schulgeld.md"]="page"
    ["schule/schulhaus/schulordnung.md"]="page"
    ["pages/speiseplan.md"]="page"
    ["schule/verwaltung.md"]="page"
    ["schule/konzept/maria-montessori/zur-person.md"]="page"
)

echo "Migrating ${#MISSING_FILES[@]} missing files..."
echo ""

SUCCESS=0
FAILED=0

for file_path in "${!MISSING_FILES[@]}"; do
    post_type="${MISSING_FILES[$file_path]}"
    full_path="${CONTENT_DIR}/${file_path}"
    
    if [ ! -f "$full_path" ]; then
        echo "❌ File not found: $full_path"
        FAILED=$((FAILED + 1))
        continue
    fi
    
    filename=$(basename "$file_path" .md)
    echo "📝 Processing: $filename ($post_type)"
    
    # Parse frontmatter using Node.js
    json=$(cd content-migration && node -e "
        const fs = require('fs');
        const matter = require('gray-matter');
        const content = fs.readFileSync('../$full_path', 'utf8');
        const { data, content: body } = matter(content);
        console.log(JSON.stringify({
            title: data.title || 'Untitled',
            content: body.trim(),
            date: data.date || '',
            image: data.image || '',
            draft: data.draft || false
        }));
    " 2>/dev/null)
    
    if [ $? -ne 0 ]; then
        echo "❌ Failed to parse: $filename"
        FAILED=$((FAILED + 1))
        continue
    fi
    
    title=$(echo "$json" | node -e "process.stdin.on('data', d => console.log(JSON.parse(d).title))")
    content=$(echo "$json" | node -e "process.stdin.on('data', d => console.log(JSON.parse(d).content))")
    date=$(echo "$json" | node -e "process.stdin.on('data', d => console.log(JSON.parse(d).date))")
    draft=$(echo "$json" | node -e "process.stdin.on('data', d => console.log(JSON.parse(d).draft))")
    
    # Determine status
    status="publish"
    if [ "$draft" = "true" ]; then
        status="draft"
    fi
    
    # Create post
    cmd="$WP_CLI post create --post_type=$post_type --post_title=\"$title\" --post_content=\"$content\" --post_status=$status --post_name=$filename --porcelain"
    
    if [ -n "$date" ] && [ "$date" != "null" ] && [ "$date" != "" ]; then
        cmd="$cmd --post_date=\"$date\""
    fi
    
    post_id=$(eval "$cmd" 2>/dev/null)
    
    if [ -n "$post_id" ] && [ "$post_id" -gt 0 ] 2>/dev/null; then
        echo "✅ Created: $title (ID: $post_id)"
        SUCCESS=$((SUCCESS + 1))
    else
        echo "❌ Failed: $title"
        FAILED=$((FAILED + 1))
    fi
    
    echo ""
done

echo "========================================"
echo "📊 Results"
echo "========================================"
echo "✅ Success: $SUCCESS"
echo "❌ Failed: $FAILED"
echo "========================================"
