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

function monte_theme_setup() {
    load_theme_textdomain('monte-theme', get_template_directory() . '/languages');
    add_theme_support('automatic-feed-links');
    add_theme_support('title-tag');
    add_theme_support('post-thumbnails');
    set_post_thumbnail_size(1200, 630, true);
    add_image_size('monte-featured', 800, 450, true);
    add_image_size('monte-thumbnail', 400, 300, true);
    add_theme_support('html5', array('search-form', 'comment-form', 'comment-list', 'gallery', 'caption', 'style', 'script'));
    add_theme_support('custom-logo', array('height' => 100, 'width' => 400, 'flex-height' => true, 'flex-width' => true));
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
    // Enqueue Google Fonts
    wp_enqueue_style('monte-fonts', 'https://fonts.googleapis.com/css2?family=Overpass:wght@300;400;500;600;700;800&family=Tangerine:wght@400;700&display=swap', array(), null);
    
    // Enqueue Font Awesome
    wp_enqueue_style('font-awesome', 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css', array(), '6.4.0');
    
    // Enqueue mmenu-js CSS
    wp_enqueue_style('mmenu-js', 'https://cdn.jsdelivr.net/npm/mmenu-js@9.3.0/dist/mmenu.css', array(), '9.3.0');
    
    // Enqueue Swiper CSS
    wp_enqueue_style('swiper', 'https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.css', array(), '11.0.0');
    
    wp_enqueue_style('monte-style', get_stylesheet_uri(), array(), wp_get_theme()->get('Version'));
    if (file_exists(get_template_directory() . '/dist/css/main.css')) {
        wp_enqueue_style('monte-main-style', get_template_directory_uri() . '/dist/css/main.css', array('monte-fonts', 'font-awesome', 'mmenu-js', 'swiper'), filemtime(get_template_directory() . '/dist/css/main.css'));
    }
    
    // Enqueue mmenu-js JavaScript
    wp_enqueue_script('mmenu-js', 'https://cdn.jsdelivr.net/npm/mmenu-js@9.3.0/dist/mmenu.js', array(), '9.3.0', true);
    
    // Enqueue Swiper JavaScript
    wp_enqueue_script('swiper', 'https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.js', array(), '11.0.0', true);
    
    if (file_exists(get_template_directory() . '/dist/js/main.js')) {
        wp_enqueue_script('monte-main-script', get_template_directory_uri() . '/dist/js/main.js', array('jquery', 'mmenu-js', 'swiper'), filemtime(get_template_directory() . '/dist/js/main.js'), true);
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
