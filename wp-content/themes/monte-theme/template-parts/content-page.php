<!-- Page Content -->
<article id="post-<?php the_ID(); ?>" <?php post_class(); ?>>
    
    <header class="entry-header">
        <h1 class="entry-title"><?php the_title(); ?></h1>
    </header>

    <?php if (has_post_thumbnail()) : ?>
        <div class="mb-6">
            <?php the_post_thumbnail('large', array('class' => 'w-full rounded')); ?>
        </div>
    <?php endif; ?>

    <div class="entry-content">
        <?php the_content(); ?>
    </div>

</article>
