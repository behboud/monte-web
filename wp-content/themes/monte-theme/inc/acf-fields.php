<?php
/**
 * ACF Field Groups
 * 
 * Register custom fields for Monte-Web content
 */

if (!defined('ABSPATH')) {
    exit; // Exit if accessed directly
}

if (function_exists('acf_add_local_field_group')) {
    
    // Homepage Banner Fields
    acf_add_local_field_group(array(
        'key' => 'group_homepage_banner',
        'title' => 'Homepage Banner',
        'fields' => array(
            array(
                'key' => 'field_banner_title',
                'label' => 'Banner Titel',
                'name' => 'banner_title',
                'type' => 'text',
                'instructions' => 'Der Haupttitel im Banner-Bereich',
                'required' => 0,
                'default_value' => '',
                'placeholder' => 'z.B. Willkommen',
            ),
            array(
                'key' => 'field_banner_content',
                'label' => 'Banner Inhalt',
                'name' => 'banner_content',
                'type' => 'textarea',
                'instructions' => 'Der Beschreibungstext im Banner-Bereich',
                'required' => 0,
                'rows' => 3,
            ),
            array(
                'key' => 'field_banner_image',
                'label' => 'Banner Bild',
                'name' => 'banner_image',
                'type' => 'image',
                'instructions' => 'Das Hintergrundbild für den Banner',
                'required' => 0,
                'return_format' => 'array',
                'preview_size' => 'medium',
                'library' => 'all',
            ),
        ),
        'location' => array(
            array(
                array(
                    'param' => 'page_type',
                    'operator' => '==',
                    'value' => 'front_page',
                ),
            ),
        ),
        'menu_order' => 0,
        'position' => 'normal',
        'style' => 'default',
        'label_placement' => 'top',
        'instruction_placement' => 'label',
    ));

    // Homepage Slider Fields
    acf_add_local_field_group(array(
        'key' => 'group_homepage_slider',
        'title' => 'Homepage Slider',
        'fields' => array(
            array(
                'key' => 'field_slider_images',
                'label' => 'Slider Bilder',
                'name' => 'slider_images',
                'type' => 'gallery',
                'instructions' => 'Wählen Sie mehrere Bilder für den Homepage-Slider aus',
                'required' => 0,
                'return_format' => 'array',
                'preview_size' => 'medium',
                'insert' => 'append',
                'library' => 'all',
                'min' => 0,
                'max' => 0,
            ),
        ),
        'location' => array(
            array(
                array(
                    'param' => 'page_type',
                    'operator' => '==',
                    'value' => 'front_page',
                ),
            ),
        ),
        'menu_order' => 1,
        'position' => 'normal',
        'style' => 'default',
        'label_placement' => 'top',
        'instruction_placement' => 'label',
    ));

    // News Post Meta Fields (for additional metadata if needed)
    acf_add_local_field_group(array(
        'key' => 'group_news_meta',
        'title' => 'Zusätzliche Nachricht-Informationen',
        'fields' => array(
            array(
                'key' => 'field_news_source',
                'label' => 'Quelle',
                'name' => 'news_source',
                'type' => 'text',
                'instructions' => 'Optional: Quelle der Nachricht',
                'required' => 0,
            ),
            array(
                'key' => 'field_news_link',
                'label' => 'Externer Link',
                'name' => 'news_link',
                'type' => 'url',
                'instructions' => 'Optional: Link zu einer externen Quelle',
                'required' => 0,
            ),
        ),
        'location' => array(
            array(
                array(
                    'param' => 'post_type',
                    'operator' => '==',
                    'value' => 'news',
                ),
            ),
        ),
        'menu_order' => 0,
        'position' => 'side',
        'style' => 'default',
        'label_placement' => 'top',
        'instruction_placement' => 'label',
    ));
}
