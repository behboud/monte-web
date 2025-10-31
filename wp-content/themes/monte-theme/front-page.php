<?php
/**
 * Template Name: Homepage
 * Description: Homepage template with banner and latest news
 */

get_header(); ?>

<main class="ml-3">
    <?php while (have_posts()) : the_post(); ?>
        <!-- Banner -->
        <?php 
        $banner_title = get_field('banner_title');
        $banner_content = get_field('banner_content');
        if ($banner_title): 
        ?>
        <div class="container pt-8">
            <div class="justify-center text-center">
                <div class="text-8xl font-calligraphy text-monte">
                    <?php echo esc_html($banner_title); ?>
                </div>
                <?php if ($banner_content): ?>
                <p class="mb-2">
                    <?php echo wp_kses_post($banner_content); ?>
                </p>
                <?php endif; ?>
            </div>
        </div>
        <?php endif; ?>
        <!-- /Banner -->

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

        <!-- Slider -->
        <?php 
        $slider_images = get_field('slider_images');
        if ($slider_images && is_array($slider_images)): 
        ?>
        <div class="w-screen left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] uk-visible-toggle uk-position-relative py-4"
             data-uk-slideshow="animation: fade; autoplay:true; max-height: 600">
            <ul class="uk-slideshow-items">
                <?php foreach ($slider_images as $image): ?>
                <li>
                    <img src="<?php echo esc_url($image['url']); ?>" 
                         alt="<?php echo esc_attr($image['alt']); ?>"
                         class="uk-animation-kenburns uk-animation-reverse uk-position-cover uk-transform-origin-center-left" 
                         data-uk-cover />
                </li>
                <?php endforeach; ?>
            </ul>
            <a class="uk-position-center-left uk-position-small uk-hidden-hover" href="#" data-uk-slidenav-previous data-uk-slideshow-item="previous"></a>
            <a class="uk-position-center-right uk-position-small uk-hidden-hover" href="#" data-uk-slidenav-next data-uk-slideshow-item="next"></a>
        </div>
        <?php endif; ?>
        <!-- /Slider -->

    <?php endwhile; ?>
</main>

<?php get_footer(); ?>
