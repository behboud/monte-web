<?php
/**
 * Template Name: Homepage
 * Description: Homepage template with latest news
 */

get_header(); ?>

<main class="ml-3">
    <?php while (have_posts()) : the_post(); ?>

        <div class="ml-1">
            <!-- Aktuelles -->
            <h2 class="text-monte text-start text-lg font-bold">AKTUELLES</h2>
        </div>
        <div class="flex flex-row flex-wrap">
            <!-- Latest news posts -->
            <?php
            $recent_news = new WP_Query(array(
                'post_type' => 'news',
                'posts_per_page' => 4,
                'orderby' => 'date',
                'order' => 'DESC'
            ));
            
            if ($recent_news->have_posts()) :
                while ($recent_news->have_posts()) : $recent_news->the_post();
            ?>
                <div class="basis-1/2 lg:basis-1/3 xl:basis-1/4 mb-2 pr-2">
                    <?php get_template_part('template-parts/card', 'news'); ?>
                </div>
            <?php 
                endwhile;
                wp_reset_postdata();
            endif;
            ?>
        </div>
        <!-- /Aktuelles -->

        <!-- Page Content -->
        <div class="container mt-8">
            <?php the_content(); ?>
        </div>

    <?php endwhile; ?>
</main>

<?php get_footer(); ?>
