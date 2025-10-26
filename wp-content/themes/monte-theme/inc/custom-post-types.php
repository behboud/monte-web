<?php
/**
 * Custom Post Types Registration
 * 
 * Registers custom post types for Monte-Web content structure
 */

if (!defined('ABSPATH')) {
    exit; // Exit if accessed directly
}

function monte_register_custom_post_types() {
    // News (Aktuelles)
    register_post_type('news', array(
        'labels' => array(
            'name' => 'Aktuelles',
            'singular_name' => 'Nachricht',
            'add_new' => 'Neue Nachricht',
            'add_new_item' => 'Neue Nachricht hinzufügen',
            'edit_item' => 'Nachricht bearbeiten',
            'view_item' => 'Nachricht ansehen',
            'all_items' => 'Alle Nachrichten',
            'search_items' => 'Nachrichten durchsuchen',
            'not_found' => 'Keine Nachrichten gefunden',
            'not_found_in_trash' => 'Keine Nachrichten im Papierkorb gefunden',
        ),
        'public' => true,
        'has_archive' => true,
        'rewrite' => array('slug' => 'aktuelles', 'with_front' => false),
        'supports' => array('title', 'editor', 'thumbnail', 'excerpt', 'author', 'comments', 'revisions'),
        'taxonomies' => array('post_tag'),
        'menu_icon' => 'dashicons-megaphone',
        'show_in_rest' => true,
        'menu_position' => 5,
    ));

    // Admission (Aufnahme)
    register_post_type('admission', array(
        'labels' => array(
            'name' => 'Aufnahme',
            'singular_name' => 'Aufnahmeseite',
            'add_new' => 'Neue Seite',
            'add_new_item' => 'Neue Aufnahmeseite hinzufügen',
            'edit_item' => 'Aufnahmeseite bearbeiten',
            'view_item' => 'Aufnahmeseite ansehen',
            'all_items' => 'Alle Aufnahmeseiten',
        ),
        'public' => true,
        'has_archive' => false,
        'hierarchical' => true,
        'rewrite' => array('slug' => 'aufnahme', 'with_front' => false),
        'supports' => array('title', 'editor', 'thumbnail', 'page-attributes', 'revisions'),
        'menu_icon' => 'dashicons-welcome-learn-more',
        'show_in_rest' => true,
        'menu_position' => 6,
    ));

    // Donation (Spenden)
    register_post_type('donation', array(
        'labels' => array(
            'name' => 'Spenden',
            'singular_name' => 'Spendenseite',
            'add_new' => 'Neue Seite',
            'add_new_item' => 'Neue Spendenseite hinzufügen',
            'edit_item' => 'Spendenseite bearbeiten',
            'view_item' => 'Spendenseite ansehen',
            'all_items' => 'Alle Spendenseiten',
        ),
        'public' => true,
        'has_archive' => false,
        'hierarchical' => true,
        'rewrite' => array('slug' => 'spenden', 'with_front' => false),
        'supports' => array('title', 'editor', 'thumbnail', 'page-attributes', 'revisions'),
        'menu_icon' => 'dashicons-heart',
        'show_in_rest' => true,
        'menu_position' => 7,
    ));

    // Association (Verein)
    register_post_type('association', array(
        'labels' => array(
            'name' => 'Verein',
            'singular_name' => 'Vereinsseite',
            'add_new' => 'Neue Seite',
            'add_new_item' => 'Neue Vereinsseite hinzufügen',
            'edit_item' => 'Vereinsseite bearbeiten',
            'view_item' => 'Vereinsseite ansehen',
            'all_items' => 'Alle Vereinsseiten',
        ),
        'public' => true,
        'has_archive' => false,
        'hierarchical' => true,
        'rewrite' => array('slug' => 'verein', 'with_front' => false),
        'supports' => array('title', 'editor', 'thumbnail', 'page-attributes', 'revisions'),
        'menu_icon' => 'dashicons-groups',
        'show_in_rest' => true,
        'menu_position' => 8,
    ));
}
add_action('init', 'monte_register_custom_post_types');
