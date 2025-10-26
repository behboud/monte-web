const fs = require("fs-extra");
const path = require("path");
const matter = require("gray-matter");
const axios = require("axios");
const FormData = require("form-data");

// Configuration
const WP_API_URL = "http://localhost:8080/wp-json/wp/v2";
const WP_AUTH = {
  username: "admin",
  password: "UBgBLxZYGbKV0xld68LAqzmL", // Application Password
};

const DRY_RUN = process.argv.includes("--dry-run");

// Section to WordPress Post Type mapping
const SECTION_MAPPING = {
  aktuelles: { postType: "news", hasArchive: true },
  aufnahme: { postType: "admission", hasArchive: false },
  spenden: { postType: "donation", hasArchive: false },
  verein: { postType: "association", hasArchive: false },
  schule: { postType: "pages", hasArchive: false },
  pages: { postType: "pages", hasArchive: false },
};

// Statistics
const stats = {
  total: 0,
  success: 0,
  failed: 0,
  images: 0,
  skipped: 0,
};

// Logging utilities
function log(message, type = "info") {
  const prefix = {
    info: "ℹ️ ",
    success: "✅",
    error: "❌",
    warning: "⚠️ ",
    dry: "🔍",
  };
  console.log(`${prefix[type] || ""}  ${message}`);
}

// Parse Hugo markdown file
async function parseHugoContent(filePath) {
  try {
    const fileContent = await fs.readFile(filePath, "utf8");
    const { data: frontmatter, content } = matter(fileContent);

    return {
      frontmatter,
      content: content.trim(),
      filePath,
      fileName: path.basename(filePath, ".md"),
    };
  } catch (error) {
    log(`Failed to parse ${filePath}: ${error.message}`, "error");
    throw error;
  }
}

// Upload image to WordPress media library
async function uploadImage(imagePath) {
  try {
    const fullPath = path.join(__dirname, "..", imagePath);

    if (!(await fs.pathExists(fullPath))) {
      log(`Image not found: ${imagePath}`, "warning");
      return null;
    }

    const imageBuffer = await fs.readFile(fullPath);
    const formData = new FormData();
    formData.append("file", imageBuffer, path.basename(imagePath));

    if (DRY_RUN) {
      log(`Would upload image: ${imagePath}`, "dry");
      return 999; // Fake ID for dry run
    }

    const response = await axios.post(`${WP_API_URL}/media`, formData, {
      auth: WP_AUTH,
      headers: formData.getHeaders(),
    });

    stats.images++;
    log(`Uploaded image: ${path.basename(imagePath)}`, "success");
    return response.data.id;
  } catch (error) {
    log(`Failed to upload image ${imagePath}: ${error.message}`, "error");
    return null;
  }
}

// Get or create tag by name
async function getOrCreateTag(tagName) {
  try {
    // Search for existing tag
    const searchResponse = await axios.get(`${WP_API_URL}/tags`, {
      auth: WP_AUTH,
      params: { search: tagName },
    });

    if (searchResponse.data.length > 0) {
      return searchResponse.data[0].id;
    }

    // Create new tag
    if (DRY_RUN) {
      log(`Would create tag: ${tagName}`, "dry");
      return 999; // Fake ID for dry run
    }

    const createResponse = await axios.post(`${WP_API_URL}/tags`, { name: tagName }, { auth: WP_AUTH });

    return createResponse.data.id;
  } catch (error) {
    log(`Failed to get/create tag ${tagName}: ${error.message}`, "warning");
    return null;
  }
}

// Create WordPress post/page
async function createPost(data, postType = "posts") {
  try {
    const wpData = {
      title: data.frontmatter.title || "Untitled",
      content: data.content || "",
      status: data.frontmatter.draft ? "draft" : "publish",
      excerpt: data.frontmatter.description || "",
    };

    // Add date if available
    if (data.frontmatter.date) {
      wpData.date = new Date(data.frontmatter.date).toISOString();
    }

    // Upload featured image if exists
    if (data.frontmatter.image) {
      const imagePath = data.frontmatter.image.startsWith("/") ? data.frontmatter.image.substring(1) : data.frontmatter.image;
      const mediaId = await uploadImage(`assets/${imagePath}`);
      if (mediaId) {
        wpData.featured_media = mediaId;
      }
    }

    // Handle tags for news posts
    if (postType === "news" && data.frontmatter.tags && Array.isArray(data.frontmatter.tags)) {
      const tagIds = [];
      for (const tagName of data.frontmatter.tags) {
        const tagId = await getOrCreateTag(tagName);
        if (tagId) {
          tagIds.push(tagId);
        }
      }
      if (tagIds.length > 0) {
        wpData.tags = tagIds;
      }
    }

    // Set slug from filename
    wpData.slug = data.fileName;

    if (DRY_RUN) {
      log(`Would create ${postType}: ${wpData.title} (${wpData.slug})`, "dry");
      log(`  Status: ${wpData.status}, Date: ${wpData.date || "now"}`, "dry");
      if (wpData.featured_media) {
        log(`  Featured image: ${data.frontmatter.image}`, "dry");
      }
      if (wpData.tags) {
        log(`  Tags: ${data.frontmatter.tags.join(", ")}`, "dry");
      }
      return { id: 999, link: `http://localhost:8080/${postType}/${wpData.slug}/` };
    }

    const response = await axios.post(`${WP_API_URL}/${postType}`, wpData, {
      auth: WP_AUTH,
    });

    stats.success++;
    log(`Created ${postType}: ${wpData.title}`, "success");
    return response.data;
  } catch (error) {
    stats.failed++;
    log(`Failed to create post ${data.frontmatter.title}: ${error.message}`, "error");
    if (error.response) {
      log(`  Response: ${JSON.stringify(error.response.data)}`, "error");
    }
    throw error;
  }
}

// Migrate homepage content with ACF fields
async function migrateHomepage() {
  log("\n📄 Migrating Homepage...", "info");

  const homepageFile = path.join(__dirname, "../content/de/_index.md");
  const data = await parseHugoContent(homepageFile);

  if (DRY_RUN) {
    log("Would set homepage ACF fields:", "dry");
    log(`  Banner title: ${data.frontmatter.banner?.title || "N/A"}`, "dry");
    log(`  Banner content: ${data.frontmatter.banner?.content || "N/A"}`, "dry");
    log(`  Banner image: ${data.frontmatter.banner?.image || "N/A"}`, "dry");
    log(`  Slider images: ${data.frontmatter.slider?.images?.length || 0} images`, "dry");
    return;
  }

  // Upload banner image
  let bannerImageId = null;
  if (data.frontmatter.banner?.image) {
    const imagePath = data.frontmatter.banner.image.startsWith("/") ? data.frontmatter.banner.image.substring(1) : data.frontmatter.banner.image;
    bannerImageId = await uploadImage(`assets/${imagePath}`);
  }

  // Upload slider images
  const sliderImageIds = [];
  if (data.frontmatter.slider?.images && Array.isArray(data.frontmatter.slider.images)) {
    for (const imageUrl of data.frontmatter.slider.images) {
      const imagePath = imageUrl.startsWith("/") ? imageUrl.substring(1) : imageUrl;
      const mediaId = await uploadImage(`assets/${imagePath}`);
      if (mediaId) {
        sliderImageIds.push(mediaId);
      }
    }
  }

  // Note: ACF fields would be set via WordPress REST API or WP-CLI
  // This requires ACF to expose fields via REST API (Pro version) or manual WP-CLI commands
  log("Homepage content prepared. ACF fields need to be set manually or via WP-CLI.", "warning");
  log(`  Banner image ID: ${bannerImageId}`, "info");
  log(`  Slider image IDs: ${sliderImageIds.join(", ")}`, "info");
}

// Migrate content from a specific section
async function migrateSection(sectionName) {
  const mapping = SECTION_MAPPING[sectionName];
  if (!mapping) {
    log(`Unknown section: ${sectionName}`, "error");
    return;
  }

  log(`\n📁 Migrating ${sectionName}/ to ${mapping.postType}...`, "info");

  const sectionDir = path.join(__dirname, `../content/de/${sectionName}`);

  if (!(await fs.pathExists(sectionDir))) {
    log(`Section directory not found: ${sectionDir}`, "warning");
    return;
  }

  const files = (await fs.readdir(sectionDir)).filter((f) => f.endsWith(".md") && f !== "_index.md");

  log(`Found ${files.length} files to migrate`, "info");

  for (const file of files) {
    stats.total++;
    try {
      const data = await parseHugoContent(path.join(sectionDir, file));

      // Skip if no title
      if (!data.frontmatter.title) {
        log(`Skipping ${file} - no title`, "warning");
        stats.skipped++;
        continue;
      }

      await createPost(data, mapping.postType);
    } catch (error) {
      log(`Error processing ${file}: ${error.message}`, "error");
    }
  }
}

// Main migration function
async function main() {
  log("🚀 Starting Hugo to WordPress Migration", "info");
  log(`Mode: ${DRY_RUN ? "DRY RUN" : "LIVE MIGRATION"}`, "info");
  log("================================================\n", "info");

  try {
    // Migrate homepage
    await migrateHomepage();

    // Migrate all sections
    const sections = ["aktuelles", "aufnahme", "spenden", "verein", "schule", "pages"];

    for (const section of sections) {
      await migrateSection(section);
    }

    // Print statistics
    log("\n================================================", "info");
    log("📊 Migration Statistics:", "info");
    log(`  Total files processed: ${stats.total}`, "info");
    log(`  Successfully migrated: ${stats.success}`, "success");
    log(`  Failed: ${stats.failed}`, stats.failed > 0 ? "error" : "info");
    log(`  Skipped: ${stats.skipped}`, "warning");
    log(`  Images uploaded: ${stats.images}`, "info");
    log("================================================\n", "info");

    if (DRY_RUN) {
      log("This was a DRY RUN. Run without --dry-run to execute migration.", "dry");
    } else {
      log("✅ Migration complete!", "success");
    }
  } catch (error) {
    log(`Migration failed: ${error.message}`, "error");
    process.exit(1);
  }
}

// Run migration
main().catch((error) => {
  log(`Unexpected error: ${error.message}`, "error");
  console.error(error);
  process.exit(1);
});
