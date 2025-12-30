<?php
/**
 * Monte Block functions and definitions.
 *
 * @link https://developer.wordpress.org/themes/basics/theme-functions/
 *
 * @package WordPress
 * @subpackage Twenty_Twenty_Five
 * @since Monte Block 1.0
 */

// Adds theme support for post formats.
if ( ! function_exists( 'monte-block_post_format_setup' ) ) :
	/**
	 * Adds theme support for post formats.
	 *
	 * @since Monte Block 1.0
	 *
	 * @return void
	 */
	function monte-block_post_format_setup() {
		add_theme_support( 'post-formats', array( 'aside', 'audio', 'chat', 'gallery', 'image', 'link', 'quote', 'status', 'video' ) );
	}
endif;
add_action( 'after_setup_theme', 'monte-block_post_format_setup' );

// Enqueues editor-style.css in the editors.
if ( ! function_exists( 'monte-block_editor_style' ) ) :
	/**
	 * Enqueues editor-style.css in the editors.
	 *
	 * @since Monte Block 1.0
	 *
	 * @return void
	 */
	function monte-block_editor_style() {
		add_editor_style( 'assets/css/editor-style.css' );
	}
endif;
add_action( 'after_setup_theme', 'monte-block_editor_style' );

// Enqueues style.css on the front.
if ( ! function_exists( 'monte-block_enqueue_styles' ) ) :
	/**
	 * Enqueues style.css on the front.
	 *
	 * @since Monte Block 1.0
	 *
	 * @return void
	 */
	function monte-block_enqueue_styles() {
		wp_enqueue_style(
			'monte-block-style',
			get_parent_theme_file_uri( 'style.css' ),
			array(),
			wp_get_theme()->get( 'Version' )
		);
	}
endif;
add_action( 'wp_enqueue_scripts', 'monte-block_enqueue_styles' );

// Registers custom block styles.
if ( ! function_exists( 'monte-block_block_styles' ) ) :
	/**
	 * Registers custom block styles.
	 *
	 * @since Monte Block 1.0
	 *
	 * @return void
	 */
	function monte-block_block_styles() {
		register_block_style(
			'core/list',
			array(
				'name'         => 'checkmark-list',
				'label'        => __( 'Checkmark', 'monte-block' ),
				'inline_style' => '
				ul.is-style-checkmark-list {
					list-style-type: "\2713";
				}

				ul.is-style-checkmark-list li {
					padding-inline-start: 1ch;
				}',
			)
		);
	}
endif;
add_action( 'init', 'monte-block_block_styles' );

// Registers pattern categories.
if ( ! function_exists( 'monte-block_pattern_categories' ) ) :
	/**
	 * Registers pattern categories.
	 *
	 * @since Monte Block 1.0
	 *
	 * @return void
	 */
	function monte-block_pattern_categories() {

		register_block_pattern_category(
			'monte-block_page',
			array(
				'label'       => __( 'Pages', 'monte-block' ),
				'description' => __( 'A collection of full page layouts.', 'monte-block' ),
			)
		);

		register_block_pattern_category(
			'monte-block_post-format',
			array(
				'label'       => __( 'Post formats', 'monte-block' ),
				'description' => __( 'A collection of post format patterns.', 'monte-block' ),
			)
		);
	}
endif;
add_action( 'init', 'monte-block_pattern_categories' );

// Registers block binding sources.
if ( ! function_exists( 'monte-block_register_block_bindings' ) ) :
	/**
	 * Registers the post format block binding source.
	 *
	 * @since Monte Block 1.0
	 *
	 * @return void
	 */
	function monte-block_register_block_bindings() {
		register_block_bindings_source(
			'monte-block/format',
			array(
				'label'              => _x( 'Post format name', 'Label for the block binding placeholder in the editor', 'monte-block' ),
				'get_value_callback' => 'monte-block_format_binding',
			)
		);
	}
endif;
add_action( 'init', 'monte-block_register_block_bindings' );

// Registers block binding callback function for the post format name.
if ( ! function_exists( 'monte-block_format_binding' ) ) :
	/**
	 * Callback function for the post format name block binding source.
	 *
	 * @since Monte Block 1.0
	 *
	 * @return string|void Post format name, or nothing if the format is 'standard'.
	 */
	function monte-block_format_binding() {
		$post_format_slug = get_post_format();

		if ( $post_format_slug && 'standard' !== $post_format_slug ) {
			return get_post_format_string( $post_format_slug );
		}
	}
endif;
