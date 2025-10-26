# Hugo to WordPress Content Migration

This directory contains scripts to migrate content from Hugo markdown files to WordPress using **WP-CLI**.

## Prerequisites

- Docker and Docker Compose running
- WordPress container accessible (`monte-wordpress`)
- Node.js installed (for parsing Hugo frontmatter)

## Installation

```bash
npm install
```

## Usage

### Run Migration

Execute the migration script:

```bash
cd /home/bebud/workspace/monte-web
bash ./content-migration/migrate.sh
```

This will:

- Parse Hugo markdown files from `content/de/`
- Create posts/pages in WordPress via WP-CLI
- Upload images to WordPress media library
- Assign tags to news posts
- Set featured images
- Display real-time progress and statistics

### Clean Up (if needed)

To remove all migrated content and start fresh:

```bash
docker-compose exec wordpress wp post delete $(docker-compose exec wordpress wp post list --post_type=news,admission,donation,association,pages,attachment --field=ID --allow-root) --force --allow-root
```

### Verify Migration

Check what was created in WordPress:

```bash
# List all posts
docker-compose exec wordpress wp post list --post_type=news,admission,donation,association,pages --allow-root

# Check tags
docker-compose exec wordpress wp term list post_tag --allow-root

# Check images
docker-compose exec wordpress wp post list --post_type=attachment --allow-root
```

## Content Mapping

| Hugo Section | WordPress Post Type | Files  | Notes                         |
| ------------ | ------------------- | ------ | ----------------------------- |
| `aktuelles/` | `news`              | 5      | With tags and featured images |
| `aufnahme/`  | `admission`         | 2      | Admission information         |
| `spenden/`   | `donation`          | 2      | Donation pages                |
| `verein/`    | `association`       | 2      | Association pages             |
| `schule/`    | `pages`             | 3      | School information            |
| `pages/`     | `pages`             | 6      | General pages                 |
| **Total**    |                     | **20** |                               |

## Migration Details

### What Gets Migrated

- ✅ Post/page title, content, and slug
- ✅ Publication dates (preserved from Hugo)
- ✅ Draft status
- ✅ Featured images (uploaded to media library)
- ✅ Tags (news posts only)
- ✅ Custom post type assignment

### Technical Implementation

**WP-CLI Approach**: This migration uses WP-CLI commands executed via Docker, which avoids WordPress REST API authentication issues.

**Image Upload**: Images are temporarily copied to `wp-content/uploads/` (mounted volume), imported via `wp media import`, then cleaned up.

**Tag Assignment**: Tags are created/retrieved by name and assigned using space-separated arguments to `wp post term set`.

**Frontmatter Parsing**: Node.js with `gray-matter` library parses Hugo markdown frontmatter in a subprocess.

## Homepage Migration

The homepage (`content/de/_index.md`) contains ACF fields for:

- Banner title, content, and image
- Slider images

These need to be set manually or via WP-CLI after running the migration script.

## Troubleshooting

### Migration Issues

**Check Docker containers are running:**

```bash
docker-compose ps
```

**Test WP-CLI access:**

```bash
docker-compose exec wordpress wp --info --allow-root
```

**View WordPress logs:**

```bash
docker-compose logs wordpress
```

### Common Issues

**"Image not found"**: Check that images exist in `assets/images/` directory.

**"Failed to create post"**: Verify custom post types exist:

```bash
docker-compose exec wordpress wp post-type list --allow-root
```

**"Node module not found"**: Run `npm install` from `content-migration/` directory.

**Duplicate content**: Clean up before re-running (see "Clean Up" section above).

## Migration Results

Last successful run migrated:

- ✅ **20 posts** across 6 sections
- ✅ **5 images** uploaded and attached
- ✅ **2 tags** created (Mitglieder, Termin) and assigned to all news posts
- ✅ **0 failures**

## Manual Steps After Migration

1. **Homepage ACF fields**: Set banner and slider fields via WordPress admin at `http://localhost:8080/wp-admin`
2. **Verify content**: Check all post types display correctly
3. **Review images**: Ensure featured images appear on news posts
4. **Test navigation**: Verify WordPress URLs match Hugo structure
5. **Check tags**: Confirm tag filtering works on news archive

## Files

- `migrate.sh` - Main migration script (WP-CLI based)
- `migrate.js` - Legacy REST API script (not used)
- `verify.js` - Verification script (not actively maintained)
- `package.json` - Node.js dependencies (gray-matter for parsing)

## Known Limitations

- Homepage ACF fields require manual configuration
- Only `news` posts get tags assigned (by design)
- Images are detected by deduplicating filename, not full path
- Script must be run from project root directory
