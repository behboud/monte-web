<?php
/**
 * Archive template for Admission (Aufnahme) post type
 */
get_header(); ?>

<?php get_template_part('template-parts/page-header'); ?>

<div class="container mx-auto px-4 lg:ml-3 pt-6">
    <div class="w-full">
        <?php if (have_posts()) : ?>
            <header class="page-header mb-8">
                <h1 class="text-4xl font-bold text-monte">
                    <?php post_type_archive_title(); ?>
                </h1>
                <?php
                $post_type_object = get_post_type_object(get_query_var('post_type'));
                if ($post_type_object && $post_type_object->description) :
                ?>
                    <div class="archive-description mt-4">
                        <?php echo wp_kses_post($post_type_object->description); ?>
                    </div>
                <?php endif; ?>
            </header>

            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <?php while (have_posts()) : the_post(); ?>
                    <article id="post-<?php the_ID(); ?>" <?php post_class('bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow'); ?>>
                        <?php if (has_post_thumbnail()) : ?>
                            <a href="<?php the_permalink(); ?>">
                                <?php the_post_thumbnail('medium', ['class' => 'w-full h-48 object-cover']); ?>
                            </a>
                        <?php endif; ?>
                        
                        <div class="p-6">
                            <h2 class="text-2xl font-bold mb-3">
                                <a href="<?php the_permalink(); ?>" class="text-monte hover:text-monte-dark">
                                    <?php the_title(); ?>
                                </a>
                            </h2>
                            
                            <?php if (has_excerpt()) : ?>
                                <div class="text-gray-600 mb-4">
                                    <?php the_excerpt(); ?>
                                </div>
                            <?php endif; ?>
                            
                            <a href="<?php the_permalink(); ?>" class="uk-button uk-button-primary">
                                <?php _e('Weiterlesen', 'monte-theme'); ?>
                            </a>
                        </div>
                    </article>
                <?php endwhile; ?>
            </div>

            <?php
            // Pagination
            the_posts_pagination(array(
                'mid_size' => 2,
                'prev_text' => __('&laquo; Zurück', 'monte-theme'),
                'next_text' => __('Weiter &raquo;', 'monte-theme'),
            ));
            ?>

        <?php else : ?>
            <p><?php _e('Keine Einträge gefunden.', 'monte-theme'); ?></p>
        <?php endif; ?>
    </div>
</div>

<?php get_footer(); ?>
