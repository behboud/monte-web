<?php
/**
 * Template for single news post
 */
get_header(); ?>

<?php get_template_part('template-parts/page-header'); ?>

<div class="container mx-auto px-4">
    <div class="pt-7 flex flex-col lg:flex-row">
        
        <!-- Main Content Area (3/4 width) -->
        <div class="lg:basis-3/4 lg:pr-8">
            <?php
            while (have_posts()) :
                the_post();
                get_template_part('template-parts/content', 'news');
            endwhile;
            ?>
        </div>

        <!-- Sidebar for Related Posts (1/4 width) -->
        <?php
        // Get related news posts
        $related_args = array(
            'post_type' => 'news',
            'posts_per_page' => 6,
            'post__not_in' => array(get_the_ID()),
            'orderby' => 'date',
            'order' => 'DESC'
        );
        
        // Try to get posts with same tags first
        $tags = wp_get_post_tags(get_the_ID());
        if ($tags) {
            $tag_ids = array();
            foreach ($tags as $tag) {
                $tag_ids[] = $tag->term_id;
            }
            $related_args['tag__in'] = $tag_ids;
        }
        
        $related_query = new WP_Query($related_args);
        
        if ($related_query->have_posts()) : ?>
            <aside class="lg:basis-1/4 lg:ml-3 mt-8 lg:mt-0">
                <h4 class="mb-4 text-lg font-bold"><?php _e('Ähnliche Beiträge:', 'monte-theme'); ?></h4>
                
                <?php while ($related_query->have_posts()) : $related_query->the_post(); ?>
                    <div class="uk-heading-divider mb-6">
                        <h3 class="uk-card-title text-monte mb-2">
                            <a href="<?php the_permalink(); ?>" class="hover:underline">
                                <?php the_title(); ?>
                            </a>
                        </h3>
                        <ul class="mb-4">
                            <li class="text-sm text-gray-600">
                                <i class="fa-regular fa-calendar mr-2"></i>
                                <?php echo get_the_date('l, j F Y'); ?>
                            </li>
                        </ul>
                    </div>
                <?php endwhile; ?>
                
                <?php wp_reset_postdata(); ?>
            </aside>
        <?php endif; ?>
        
    </div>
</div>

<?php get_footer(); ?>
