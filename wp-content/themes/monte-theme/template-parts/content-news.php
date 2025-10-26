<!-- News Article Content -->
<article id="post-<?php the_ID(); ?>" <?php post_class(); ?>>
    
    <?php if (has_post_thumbnail()) : ?>
        <div class="mb-10">
            <?php the_post_thumbnail('large', array('class' => 'w-full rounded')); ?>
        </div>
    <?php endif; ?>

    <header class="entry-header">
        <h1 class="entry-title"><?php the_title(); ?></h1>
        
        <ul class="mb-4 entry-meta">
            <li class="mr-4 inline-block">
                <i class="fa-regular fa-calendar mr-2"></i>
                <?php echo get_the_date('l, j F Y'); ?>
            </li>
            
            <?php
            $tags = get_the_tags();
            if ($tags) : ?>
                <li class="mr-4 inline-block">
                    <?php foreach ($tags as $tag) : ?>
                        <a class="uk-btn uk-btn-text mr-2" href="<?php echo esc_url(get_tag_link($tag->term_id)); ?>">
                            <i class="fa fa-tag mr-1"></i>
                            <?php echo esc_html($tag->name); ?>
                        </a>
                    <?php endforeach; ?>
                </li>
            <?php endif; ?>
        </ul>
    </header>

    <div class="content mb-10 uk-heading-divider entry-content">
        <?php the_content(); ?>
    </div>

</article>
