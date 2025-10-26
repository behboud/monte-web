<?php
/**
 * Breadcrumb navigation component
 */
if (!function_exists('monte_get_breadcrumb')) {
    function monte_get_breadcrumb() {
        $breadcrumb = array();
        
        // Always start with home
        $breadcrumb[] = array(
            'title' => __('Startseite', 'monte-theme'),
            'url' => home_url('/'),
            'current' => is_front_page()
        );
        
        if (!is_front_page()) {
            // Get ancestors for pages
            if (is_page()) {
                $ancestors = get_post_ancestors(get_the_ID());
                if ($ancestors) {
                    $ancestors = array_reverse($ancestors);
                    foreach ($ancestors as $ancestor) {
                        $breadcrumb[] = array(
                            'title' => get_the_title($ancestor),
                            'url' => get_permalink($ancestor),
                            'current' => false
                        );
                    }
                }
            }
            // Get post type archive for custom post types
            elseif (is_singular() && !is_singular('post')) {
                $post_type = get_post_type();
                $post_type_object = get_post_type_object($post_type);
                if ($post_type_object && $post_type_object->has_archive) {
                    $breadcrumb[] = array(
                        'title' => $post_type_object->labels->name,
                        'url' => get_post_type_archive_link($post_type),
                        'current' => false
                    );
                }
            }
            // Get category for posts
            elseif (is_single() && is_singular('post')) {
                $categories = get_the_category();
                if ($categories) {
                    $breadcrumb[] = array(
                        'title' => $categories[0]->name,
                        'url' => get_category_link($categories[0]->term_id),
                        'current' => false
                    );
                }
            }
            // Archive pages
            elseif (is_archive()) {
                if (is_category()) {
                    $category = get_queried_object();
                    $breadcrumb[] = array(
                        'title' => $category->name,
                        'url' => '',
                        'current' => true
                    );
                } elseif (is_post_type_archive()) {
                    $post_type_object = get_queried_object();
                    $breadcrumb[] = array(
                        'title' => $post_type_object->label,
                        'url' => '',
                        'current' => true
                    );
                }
            }
            // Search results
            elseif (is_search()) {
                $breadcrumb[] = array(
                    'title' => __('Suchergebnisse', 'monte-theme'),
                    'url' => '',
                    'current' => true
                );
            }
            // 404
            elseif (is_404()) {
                $breadcrumb[] = array(
                    'title' => __('Seite nicht gefunden', 'monte-theme'),
                    'url' => '',
                    'current' => true
                );
            }
            
            // Current page (if singular)
            if (is_singular()) {
                $breadcrumb[] = array(
                    'title' => get_the_title(),
                    'url' => '',
                    'current' => true
                );
            }
        }
        
        return $breadcrumb;
    }
}

$breadcrumb = monte_get_breadcrumb();
if ($breadcrumb && count($breadcrumb) > 1) :
?>
<ul class="uk-breadcrumb uppercase mt-2 font-bold text-lg text-monte">
    <?php foreach ($breadcrumb as $item) : ?>
        <li<?php echo $item['current'] ? '' : ''; ?>>
            <?php if ($item['url'] && !$item['current']) : ?>
                <a href="<?php echo esc_url($item['url']); ?>">
                    <?php echo esc_html($item['title']); ?>
                </a>
            <?php else : ?>
                <span class="text-dark">
                    <?php echo esc_html($item['title']); ?>
                </span>
            <?php endif; ?>
        </li>
    <?php endforeach; ?>
</ul>
<?php endif; ?>
