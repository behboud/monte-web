<?php
/**
 * Template for news archive (aktuelles)
 */
get_header(); ?>

<div class="container mx-auto px-4 pt-6">
    
    <header class="page-header mb-8">
        <h1 class="page-title text-3xl font-bold mb-2">
            <?php _e('Aktuelles', 'monte-theme'); ?>
        </h1>
        <?php
        $archive_description = get_the_archive_description();
        if ($archive_description) {
            echo '<div class="archive-description">' . $archive_description . '</div>';
        }
        ?>
    </header>

    <?php if (have_posts()) : ?>
        <div class="flex flex-row flex-wrap">
            <?php
            while (have_posts()) :
                the_post();
                ?>
                <div class="basis-full sm:basis-1/2 lg:basis-1/3 xl:basis-1/4 mb-6 px-2">
                    <div class="uk-card uk-card-body h-full flex flex-col justify-between border rounded-lg shadow-sm hover:shadow-md transition-shadow">
                        <div class="container">
                            <h3 class="uk-card-title text-monte mb-2 text-xl font-bold">
                                <a href="<?php the_permalink(); ?>" class="hover:underline">
                                    <?php the_title(); ?>
                                </a>
                            </h3>
                            
                            <ul class="mb-4 text-sm">
                                <li class="mr-4 inline-block text-gray-600">
                                    <i class="fa-regular fa-calendar"></i>
                                    <?php echo get_the_date('l, j F Y'); ?>
                                </li>
                                
                                <?php
                                $tags = get_the_tags();
                                if ($tags) : ?>
                                    <li class="mr-4 inline-block">
                                        <?php foreach ($tags as $tag) : ?>
                                            <a class="uk-btn uk-btn-text mr-1 text-xs" href="<?php echo esc_url(get_tag_link($tag->term_id)); ?>">
                                                <i class="fa fa-tag mr-1"></i>
                                                <?php echo esc_html($tag->name); ?>
                                            </a>
                                        <?php endforeach; ?>
                                    </li>
                                <?php endif; ?>
                            </ul>
                            
                            <?php if (has_excerpt()) : ?>
                                <p class="mb-6 text-gray-700"><?php echo get_the_excerpt(); ?></p>
                            <?php else : ?>
                                <p class="mb-6 text-gray-700"><?php echo wp_trim_words(get_the_content(), 20, '...'); ?></p>
                            <?php endif; ?>
                        </div>
                        
                        <a class="uk-btn uk-btn-default w-fit mt-auto" href="<?php the_permalink(); ?>">
                            <?php _e('Weiterlesen', 'monte-theme'); ?>
                        </a>
                    </div>
                </div>
            <?php endwhile; ?>
        </div>

        <!-- Pagination -->
        <div class="pagination mt-8">
            <?php
            the_posts_pagination(array(
                'mid_size' => 2,
                'prev_text' => __('&laquo; Zurück', 'monte-theme'),
                'next_text' => __('Weiter &raquo;', 'monte-theme'),
            ));
            ?>
        </div>
    <?php else : ?>
        <p><?php _e('Keine Beiträge gefunden.', 'monte-theme'); ?></p>
    <?php endif; ?>

</div>

<?php get_footer(); ?>
