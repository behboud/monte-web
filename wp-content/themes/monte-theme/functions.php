<?php
/**
 * Monte Montessori Theme Functions
 */

if (!defined('ABSPATH')) {
    exit;
}

// Theme includes
require_once get_template_directory() . '/inc/custom-post-types.php';
require_once get_template_directory() . '/inc/acf-fields.php';
require_once get_template_directory() . '/inc/class-menu-walker.php';
require_once get_template_directory() . '/inc/seo-migration.php';

function monte_theme_setup() {
    load_theme_textdomain('monte-theme', get_template_directory() . '/languages');
    add_theme_support('automatic-feed-links');
    add_theme_support('title-tag');
    add_theme_support('post-thumbnails');
    set_post_thumbnail_size(1200, 630, true);
    add_image_size('monte-featured', 800, 450, true);
    add_image_size('monte-thumbnail', 400, 300, true);
    add_theme_support('html5', array('search-form', 'comment-form', 'comment-list', 'gallery', 'caption', 'style', 'script'));
    add_theme_support('custom-logo', array('height' => 118, 'width' => 88, 'flex-height' => true, 'flex-width' => true));
    register_nav_menus(array(
        'top-menu' => __('Top Menu', 'monte-theme'),
        'main-menu' => __('Main Menu', 'monte-theme'),
        'footer-menu' => __('Footer Menu', 'monte-theme'),
    ));
    add_theme_support('wp-block-styles');
    add_theme_support('editor-styles');
    add_theme_support('responsive-embeds');
}
add_action('after_setup_theme', 'monte_theme_setup');

function monte_enqueue_assets() {
    // Enqueue Google Fonts (using variable weight to match Hugo)
    wp_enqueue_style('monte-fonts', 'https://fonts.googleapis.com/css2?family=Overpass:ital,wght@0,100..900;1,100..900&family=Tangerine:wght@400;700&display=swap', array(), null);
    
    // Enqueue Font Awesome
    wp_enqueue_style('font-awesome', 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css', array(), '6.4.0');
    
    wp_enqueue_style('monte-style', get_stylesheet_uri(), array(), wp_get_theme()->get('Version'));
    
    // Main Tailwind CSS
    if (file_exists(get_template_directory() . '/dist/css/main.css')) {
        wp_enqueue_style('monte-main-style', get_template_directory_uri() . '/dist/css/main.css', array('monte-fonts', 'font-awesome'), filemtime(get_template_directory() . '/dist/css/main.css'));
    }
    
    // Webpack bundled CSS (includes Mmenu.js and Swiper styles)
    if (file_exists(get_template_directory() . '/dist/css/main-bundle.css')) {
        wp_enqueue_style('monte-bundle-style', get_template_directory_uri() . '/dist/css/main-bundle.css', array('monte-main-style'), filemtime(get_template_directory() . '/dist/css/main-bundle.css'));
    }
    
    // Main bundled JavaScript (includes Mmenu.js and Swiper)
    if (file_exists(get_template_directory() . '/dist/js/main.js')) {
        wp_enqueue_script('monte-main-script', get_template_directory_uri() . '/dist/js/main.js', array('jquery'), filemtime(get_template_directory() . '/dist/js/main.js'), true);
        wp_localize_script('monte-main-script', 'monteData', array('ajaxUrl' => admin_url('admin-ajax.php'), 'nonce' => wp_create_nonce('monte-nonce'), 'homeUrl' => home_url('/')));
    }
}
add_action('wp_enqueue_scripts', 'monte_enqueue_assets');

function monte_widgets_init() {
    register_sidebar(array(
        'name' => __('Footer Widget Area', 'monte-theme'),
        'id' => 'footer-1',
        'description' => __('Add widgets here to appear in your footer.', 'monte-theme'),
        'before_widget' => '<section id="%1$s" class="widget %2$s">',
        'after_widget' => '</section>',
        'before_title' => '<h2 class="widget-title">',
        'after_title' => '</h2>',
    ));
}
add_action('widgets_init', 'monte_widgets_init');

function monte_rewrite_flush() {
    monte_register_custom_post_types();
    flush_rewrite_rules();
}
add_action('after_switch_theme', 'monte_rewrite_flush');

// Customizer settings for social media links
function monte_customize_register($wp_customize) {
    // Add Social Media Section
    $wp_customize->add_section('monte_social_media', array(
        'title' => __('Social Media', 'monte-theme'),
        'priority' => 30,
    ));
    
    // Facebook URL
    $wp_customize->add_setting('monte_facebook_url', array(
        'default' => '',
        'sanitize_callback' => 'esc_url_raw',
    ));
    $wp_customize->add_control('monte_facebook_url', array(
        'label' => __('Facebook URL', 'monte-theme'),
        'section' => 'monte_social_media',
        'type' => 'url',
    ));
    
    // Instagram URL
    $wp_customize->add_setting('monte_instagram_url', array(
        'default' => '',
        'sanitize_callback' => 'esc_url_raw',
    ));
    $wp_customize->add_control('monte_instagram_url', array(
        'label' => __('Instagram URL', 'monte-theme'),
        'section' => 'monte_social_media',
        'type' => 'url',
    ));
    
    // Twitter URL
    $wp_customize->add_setting('monte_twitter_url', array(
        'default' => '',
        'sanitize_callback' => 'esc_url_raw',
    ));
    $wp_customize->add_control('monte_twitter_url', array(
        'label' => __('Twitter URL', 'monte-theme'),
        'section' => 'monte_social_media',
        'type' => 'url',
    ));
}
add_action('customize_register', 'monte_customize_register');

// Add container and mx-auto classes to body to match Hugo layout
function monte_body_classes($classes) {
    $classes[] = 'bg-body';
    $classes[] = 'container';
    $classes[] = 'mx-auto';
    return $classes;
}
add_filter('body_class', 'monte_body_classes');

// Add favicon to head
function monte_add_favicon() {
    $favicon_url = get_template_directory_uri() . '/assets/images/favicon-96x96.png';
    echo '<link rel="icon" type="image/png" sizes="96x96" href="' . esc_url($favicon_url) . '">' . "\n";
    echo '<link rel="shortcut icon" type="image/png" href="' . esc_url($favicon_url) . '">' . "\n";
}
add_action('wp_head', 'monte_add_favicon');

// Automatically create default menus from Hugo configuration
function monte_create_default_menus() {
    // Only run once
    if (get_option('monte_menus_created')) {
        return;
    }
    
    // Check if menus already exist
    $menus = wp_get_nav_menus();
    $menu_names = wp_list_pluck($menus, 'name');
    
    // Define menu structure from Hugo's menus.de.toml with full hierarchy
    $menu_structures = array(
        'Top Menu' => array(
            'NEWS' => array('url' => home_url('/aktuelles/'), 'weight' => 1),
            'KONTAKT' => array('url' => home_url('/pages/kontakt/'), 'weight' => 2),
            'SPENDEN' => array('url' => home_url('/spenden/spenden/'), 'weight' => 3),
            'SPEISEPLAN' => array('url' => home_url('/pages/speiseplan/'), 'weight' => 4, 'icon' => 'fa fa-utensils'),
            'ELTERN-LOGIN' => array('url' => 'https://www.montessorischule-gilching.de/login', 'weight' => 5, 'icon' => 'fa fa-user-lock'),
        ),
        'Main Menu' => array(
            'Startseite' => array('url' => home_url('/'), 'weight' => 1),
            'Unsere Schule' => array('url' => '#', 'weight' => 2,
                'children' => array(
                    'Konzept' => array('url' => '#', 'weight' => 1,
                        'children' => array(
                            'Qualitäten' => array('url' => home_url('/schule/konzept/qualitaeten/'), 'weight' => 1),
                            'Maria Montessori' => array('url' => '#', 'weight' => 2,
                                'children' => array(
                                    'Zur Person' => array('url' => home_url('/schule/konzept/maria-montessori/zur-person/'), 'weight' => 1),
                                    'Grundzüge der Pädagogik' => array('url' => home_url('/schule/konzept/maria-montessori/grundzuege-der-paedagogik/'), 'weight' => 2),
                                ),
                            ),
                        ),
                    ),
                    'Schulhaus' => array('url' => '#', 'weight' => 2,
                        'children' => array(
                            'Haus' => array('url' => home_url('/schule/schulhaus/haus/'), 'weight' => 1),
                            'Küche' => array('url' => home_url('/schule/schulhaus/kueche/'), 'weight' => 2),
                            'Schulgeld' => array('url' => home_url('/schule/schulhaus/schulgeld/'), 'weight' => 3),
                            'Schulordnung' => array('url' => home_url('/schule/schulhaus/schulordnung/'), 'weight' => 4),
                        ),
                    ),
                    'Verwaltung' => array('url' => home_url('/schule/verwaltung/'), 'weight' => 3),
                    'Pädagogisches Team' => array('url' => home_url('/schule/paedagogisches-team/'), 'weight' => 4),
                    'Schüler*innen' => array('url' => home_url('/schule/schuelerinnen/'), 'weight' => 5),
                    'Elternengagement' => array('url' => '#', 'weight' => 6,
                        'children' => array(
                            'Elternbeirat' => array('url' => home_url('/schule/elternengagement/elternbeirat/'), 'weight' => 1),
                            'AGs und Dienste' => array('url' => home_url('/schule/elternengagement/ags-und-dienste/'), 'weight' => 2),
                        ),
                    ),
                ),
            ),
            'Aufnahme' => array('url' => '#', 'weight' => 3,
                'children' => array(
                    'Anmeldeunterlagen' => array('url' => home_url('/aufnahme/anmeldeunterlagen/'), 'weight' => 1),
                    'Schulgeld' => array('url' => home_url('/aufnahme/schulgeld/'), 'weight' => 2),
                ),
            ),
            'Spenden und Förderer' => array('url' => '#', 'weight' => 4,
                'children' => array(
                    'Förderer' => array('url' => home_url('/spenden/foerderer/'), 'weight' => 1),
                    'Spenden' => array('url' => home_url('/spenden/spenden/'), 'weight' => 2),
                ),
            ),
            'Verein' => array('url' => '#', 'weight' => 5,
                'children' => array(
                    'Vorstand' => array('url' => home_url('/verein/vorstand/'), 'weight' => 1),
                    'Satzung' => array('url' => home_url('/verein/satzung/'), 'weight' => 2),
                ),
            ),
            'Karriere' => array('url' => home_url('/pages/karriere/'), 'weight' => 6),
            'Presse' => array('url' => home_url('/pages/presse/'), 'weight' => 7),
        ),
        'Footer Menu' => array(
            'Impressum' => array('url' => home_url('/pages/impressum/'), 'weight' => 1),
            'Datenschutzerklärung' => array('url' => home_url('/pages/datenschutz/'), 'weight' => 2),
            'Login' => array('url' => 'https://www.montessorischule-gilching.de/login', 'weight' => 3),
        ),
    );
    
    $locations = get_theme_mod('nav_menu_locations');
    
    foreach ($menu_structures as $menu_name => $items) {
        // Create menu if it doesn't exist
        if (!in_array($menu_name, $menu_names)) {
            $menu_id = wp_create_nav_menu($menu_name);
            
            // Add menu items recursively
            foreach ($items as $title => $item_data) {
                monte_add_menu_item($menu_id, $title, $item_data, 0);
            }
            
            // Assign menu to location
            $location_key = strtolower(str_replace(' ', '-', $menu_name));
            if ($location_key === 'main-menu') {
                $locations['main-menu'] = $menu_id;
            } elseif ($location_key === 'top-menu') {
                $locations['top-menu'] = $menu_id;
            } elseif ($location_key === 'footer-menu') {
                $locations['footer-menu'] = $menu_id;
            }
        }
    }
    
    // Save menu locations
    set_theme_mod('nav_menu_locations', $locations);
    
    // Mark as created
    update_option('monte_menus_created', true);
}

function monte_add_menu_item($menu_id, $title, $item_data, $parent_id = 0) {
    $menu_item_data = array(
        'menu-item-title' => $title,
        'menu-item-url' => $item_data['url'],
        'menu-item-status' => 'publish',
        'menu-item-type' => 'custom',
        'menu-item-parent-id' => $parent_id,
    );
    
    // Add icon to description field if provided
    if (isset($item_data['icon'])) {
        $menu_item_data['menu-item-description'] = $item_data['icon'];
    }
    
    $item_id = wp_update_nav_menu_item($menu_id, 0, $menu_item_data);
    
    // Update menu order
    if (isset($item_data['weight'])) {
        update_post_meta($item_id, 'menu_order', $item_data['weight']);
    }
    
    // Add children recursively
    if (isset($item_data['children'])) {
        foreach ($item_data['children'] as $child_title => $child_data) {
            monte_add_menu_item($menu_id, $child_title, $child_data, $item_id);
        }
    }
}
add_action('after_setup_theme', 'monte_create_default_menus', 20);
