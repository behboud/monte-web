<?php
/**
 * Template for donation pages (Spenden)
 * 
 * Displays special layout with calligraphy heading and repeater field items
 */
get_header(); 

while (have_posts()) : the_post();
?>

<?php get_template_part('template-parts/page-header'); ?>

<?php if (function_exists('get_field')) :
    $uberschrift = get_field('uberschrift');
    $spenden = get_field('spenden');
    
    // Display calligraphy heading
    if ($uberschrift) : ?>
        <div class="ml-3 mb-8 mt-8 text-8xl font-calligraphy font-italic text-center text-monte">
            <?php echo esc_html($uberschrift); ?>
        </div>
    <?php endif;
    
    // Display donation items from repeater field
    if ($spenden && is_array($spenden)) :
        foreach ($spenden as $item) :
            $image = $item['image'] ?? null;
            $title = $item['title'] ?? '';
            $content = $item['content'] ?? '';
            ?>
            <div class="mb-12 ml-3">
                <div class="container flex flex-row">
                    <?php if ($image) : 
                        $image_url = is_array($image) ? $image['url'] : $image;
                        $image_alt = is_array($image) ? ($image['alt'] ?? 'spende') : 'spende';
                    ?>
                        <img src="<?php echo esc_url($image_url); ?>" 
                             alt="<?php echo esc_attr($image_alt); ?>" 
                             class="w-1/3 mr-4" />
                    <?php endif; ?>
                    <div class="flex flex-col justify-start">
                        <?php if ($title) : ?>
                            <h4><?php echo wp_kses_post($title); ?></h4>
                        <?php endif; ?>
                        <?php if ($content) : ?>
                            <p><?php echo wp_kses_post($content); ?></p>
                        <?php endif; ?>
                    </div>
                </div>
            </div>
        <?php endforeach;
    endif;
else : ?>
    <!-- Fallback if ACF is not available -->
    <div class="container mx-auto px-4 lg:ml-3 pt-6">
        <div class="w-full">
            <?php get_template_part('template-parts/content', 'page'); ?>
        </div>
    </div>
<?php endif;

endwhile;

get_footer();
?>
