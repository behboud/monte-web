<?php
/**
 * Template Name: Kontakt
 * Template for displaying the contact page with contact form
 */
get_header(); ?>

<?php get_template_part('template-parts/page-header'); ?>

<div class="container mx-auto px-4 lg:ml-3 pt-6 flex justify-start">
    <div class="w-full">
        <?php while (have_posts()) : the_post(); ?>
            <article id="post-<?php the_ID(); ?>" <?php post_class(); ?>>
                
                <header class="entry-header mb-6">
                    <h1 class="entry-title text-3xl font-bold"><?php the_title(); ?></h1>
                </header>

                <?php if (has_post_thumbnail()) : ?>
                    <div class="mb-6">
                        <?php the_post_thumbnail('large', array('class' => 'w-full rounded')); ?>
                    </div>
                <?php endif; ?>

                <div class="entry-content mb-8">
                    <?php the_content(); ?>
                </div>

                <!-- Contact Form Section -->
                <div class="contact-form-section bg-light p-6 rounded-lg shadow-sm">
                    <h2 class="text-2xl font-semibold mb-4">Kontaktformular</h2>
                    <p class="mb-6 text-gray-600">
                        Für allgemeine Anfragen nutzen Sie bitte das folgende Kontaktformular. 
                        Wir werden uns schnellstmöglich bei Ihnen melden.
                    </p>
                    <?php echo do_shortcode('[contact-form-7 id="258" title="Kontaktformular"]'); ?>
                </div>

            </article>
        <?php endwhile; ?>
    </div>
</div>

<?php get_footer(); ?>
