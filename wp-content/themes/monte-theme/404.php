<?php
/**
 * The template for displaying 404 pages (Not Found)
 */

get_header(); ?>

<main>
    <section class="flex flex-col justify-center items-center text-center pt-7 min-h-[60vh]">
        <span class="text-9xl font-bold text-monte mb-4">404</span>
        <h1 class="text-4xl font-bold mb-4">Die gesuchte Seite konnte nicht gefunden werden</h1>
        
        <p class="text-lg mb-6 max-w-2xl">
            Die Seite, die Sie suchen, wurde möglicherweise entfernt, hat einen anderen Namen oder ist vorübergehend nicht verfügbar.
        </p>
        
        <a href="<?php echo esc_url(home_url('/')); ?>" class="uk-btn uk-btn-default mt-6">
            Zurück zur Startseite
        </a>

        <!-- Optional: Search form -->
        <div class="mt-8 w-full max-w-md">
            <?php get_search_form(); ?>
        </div>
    </section>
</main>

<?php get_footer(); ?>
