const axios = require("axios");

const WP_API_URL = "http://localhost:8080/wp-json/wp/v2";
const WP_AUTH = {
  username: "admin",
  password: "admin",
};

async function verifyMigration() {
  console.log("🔍 Verifying WordPress Content Migration...\n");

  try {
    // Check posts in each post type
    const postTypes = [
      { name: "news", endpoint: "news" },
      { name: "admission", endpoint: "admission" },
      { name: "donation", endpoint: "donation" },
      { name: "association", endpoint: "association" },
      { name: "pages", endpoint: "pages" },
    ];

    let totalPosts = 0;
    let totalImages = 0;

    for (const postType of postTypes) {
      try {
        const response = await axios.get(`${WP_API_URL}/${postType.endpoint}`, {
          auth: WP_AUTH,
          params: { per_page: 100 },
        });

        const count = response.data.length;
        totalPosts += count;

        console.log(`✅ ${postType.name}: ${count} posts`);

        // Check for featured images
        const withImages = response.data.filter((post) => post.featured_media > 0).length;
        console.log(`   - ${withImages} with featured images`);
      } catch (error) {
        console.log(`❌ ${postType.name}: Error - ${error.message}`);
      }
    }

    // Check media library
    const mediaResponse = await axios.get(`${WP_API_URL}/media`, {
      auth: WP_AUTH,
      params: { per_page: 100 },
    });
    totalImages = mediaResponse.data.length;

    console.log(`\n📊 Summary:`);
    console.log(`   Total posts/pages: ${totalPosts}`);
    console.log(`   Total images: ${totalImages}`);

    // Check tags
    const tagsResponse = await axios.get(`${WP_API_URL}/tags`, {
      auth: WP_AUTH,
    });
    console.log(`   Total tags: ${tagsResponse.data.length}`);

    console.log("\n✅ Verification complete!");
  } catch (error) {
    console.error(`❌ Verification failed: ${error.message}`);
    process.exit(1);
  }
}

verifyMigration();
