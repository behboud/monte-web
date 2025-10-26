<?php
/**
 * Template for displaying pages
 */
get_header(); ?>

<?php get_template_part('template-parts/page-header'); ?>

<div class="container mx-auto px-4 lg:ml-3 pt-6 flex justify-start">
    <div class="w-full">
        <?php
        while (have_posts()) :
            the_post();
            get_template_part('template-parts/content', 'page');
        endwhile;
        ?>
    </div>
</div>

<?php get_footer(); ?>
