<?php
/**
 * Template for single posts (generic fallback)
 */
get_header(); ?>

<?php get_template_part('template-parts/page-header'); ?>

<div class="container mx-auto px-4 lg:ml-3 pt-6">
    <div class="w-full">
        <?php
        while (have_posts()) :
            the_post();
            
            // Try to find a specific template part first
            $post_type = get_post_type();
            if ($post_type !== 'post') {
                // Try custom post type template part
                get_template_part('template-parts/content', $post_type);
            } else {
                // Default to page template
                get_template_part('template-parts/content', 'page');
            }
        endwhile;
        ?>
    </div>
</div>

<?php get_footer(); ?>
