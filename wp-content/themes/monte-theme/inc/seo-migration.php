<?php
/**
 * SEO Migration Functions
 * Handles migration of Hugo frontmatter SEO fields to Yoast SEO
 */

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Migrate Hugo meta_title and description to Yoast SEO fields
 * 
 * This function migrates custom meta fields from Hugo migration to Yoast SEO format
 * It looks for _meta_title and _description post meta and converts them to Yoast format
 */
function monte_import_yoast_meta() {
    // Get all posts, pages, and custom post types
    $post_types = array('post', 'page', 'news', 'admission', 'donation', 'association');
    
    $posts = get_posts(array(
        'post_type' => $post_types,
        'posts_per_page' => -1,
        'post_status' => 'any'
    ));

    $updated_count = 0;
    $processed_count = 0;

    foreach ($posts as $post) {
        $processed_count++;
        $updated_fields = array();
        
        // Get Hugo meta fields (these would have been set during content migration)
        $meta_title = get_post_meta($post->ID, '_meta_title', true);
        $description = get_post_meta($post->ID, '_description', true);

        // Migrate meta title to Yoast if it exists and is not empty
        if (!empty($meta_title) && $meta_title !== '') {
            update_post_meta($post->ID, '_yoast_wpseo_title', $meta_title);
            $updated_fields[] = 'title';
        }
        
        // Migrate description to Yoast if it exists and is not empty
        if (!empty($description) && $description !== '') {
            update_post_meta($post->ID, '_yoast_wpseo_metadesc', $description);
            $updated_fields[] = 'description';
        }

        if (!empty($updated_fields)) {
            $updated_count++;
            error_log(sprintf(
                'Updated Yoast SEO fields for post ID %d (%s): %s',
                $post->ID,
                $post->post_title,
                implode(', ', $updated_fields)
            ));
        }
    }

    return array(
        'processed' => $processed_count,
        'updated' => $updated_count
    );
}

/**
 * WP-CLI command to migrate SEO data
 */
if (defined('WP_CLI') && WP_CLI) {
    WP_CLI::add_command('monte seo-migrate', function() {
        WP_CLI::log('Starting SEO metadata migration...');
        
        $result = monte_import_yoast_meta();
        
        WP_CLI::success(sprintf(
            'Migration complete! Processed %d posts, updated %d posts with SEO data.',
            $result['processed'],
            $result['updated']
        ));
    });
}

/**
 * Admin notice to prompt SEO migration
 */
function monte_seo_migration_admin_notice() {
    // Only show to administrators
    if (!current_user_can('manage_options')) {
        return;
    }

    // Check if migration has been run (store flag in options)
    $migration_done = get_option('monte_seo_migration_done', false);
    
    if ($migration_done) {
        return;
    }

    ?>
    <div class="notice notice-info is-dismissible">
        <p>
            <strong>Monte Theme:</strong> 
            Hugo SEO metadata is ready to migrate to Yoast SEO. 
            Run: <code>wp monte seo-migrate --allow-root</code>
        </p>
    </div>
    <?php
}
add_action('admin_notices', 'monte_seo_migration_admin_notice');

/**
 * Set migration flag via AJAX
 */
function monte_set_seo_migration_done() {
    check_ajax_referer('monte-nonce', 'nonce');
    
    if (!current_user_can('manage_options')) {
        wp_send_json_error('Unauthorized');
    }
    
    update_option('monte_seo_migration_done', true);
    wp_send_json_success();
}
add_action('wp_ajax_monte_set_seo_migration_done', 'monte_set_seo_migration_done');
