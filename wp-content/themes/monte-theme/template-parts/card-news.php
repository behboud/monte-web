<?php
/**
 * Template part for displaying news cards
 */
?>

<div class="uk-card uk-card-body h-full flex flex-col justify-between">
    <div class="container">
        <h3 class="uk-card-title text-monte mb-2">
            <a href="<?php the_permalink(); ?>">
                <?php the_title(); ?>
            </a>
        </h3>
        <ul class="mb-4">
            <li class="mr-4 inline-block">
                <i class="fa-regular fa-calendar"></i>
                <?php echo get_the_date('l, j F Y'); ?>
            </li>
            <?php 
            $tags = get_the_tags();
            if ($tags): 
            ?>
                <li class="mr-4 inline-block">
                    <?php foreach ($tags as $index => $tag): ?>
                        <a class="uk-btn uk-btn-text mr-1" href="<?php echo get_tag_link($tag->term_id); ?>">
                            <i class="fa fa-tag mr-1"></i>
                            <?php echo esc_html($tag->name); ?>
                        </a>
                    <?php endforeach; ?>
                </li>
            <?php endif; ?>
        </ul>
        <p class="mb-6"><?php echo wp_trim_words(get_the_excerpt(), 30, '...'); ?></p>
    </div>
    <a class="uk-btn uk-btn-default w-fit" href="<?php the_permalink(); ?>">
        <?php _e('Weiterlesen', 'monte-theme'); ?>
    </a>
</div>
