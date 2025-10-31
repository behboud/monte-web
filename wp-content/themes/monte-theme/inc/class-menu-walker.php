<?php
/**
 * Custom Menu Walker for Tailwind/Franken UI styling
 * Supports multilevel menus with proper classes
 */

if (!defined('ABSPATH')) {
    exit;
}

class Monte_Menu_Walker extends Walker_Nav_Menu {
    
    /**
     * Starts the element output.
     *
     * @param string   $output Used to append additional content (passed by reference).
     * @param WP_Post  $item   Menu item data object.
     * @param int      $depth  Depth of menu item. Used for padding.
     * @param stdClass $args   An object of wp_nav_menu() arguments.
     * @param int      $id     Current item ID.
     */
    public function start_el(&$output, $item, $depth = 0, $args = null, $id = 0) {
        $indent = ($depth) ? str_repeat("\t", $depth) : '';
        
        $classes = empty($item->classes) ? array() : (array) $item->classes;
        $classes[] = 'menu-item-' . $item->ID;
        
        // Add active class
        if (in_array('current-menu-item', $classes) || in_array('current-menu-ancestor', $classes)) {
            $classes[] = 'active';
        }
        
        // Add class for items with children
        if (in_array('menu-item-has-children', $classes)) {
            $classes[] = 'has-children';
        }
        
        // Add styling for top menu items at depth 0
        if ($depth === 0 && isset($args->theme_location) && $args->theme_location === 'top-menu') {
            $classes[] = 'm-3';
            $classes[] = 'pt-1';
        }
        
        $class_names = join(' ', apply_filters('nav_menu_css_class', array_filter($classes), $item, $args, $depth));
        $class_names = $class_names ? ' class="' . esc_attr($class_names) . '"' : '';
        
        $id = apply_filters('nav_menu_item_id', 'menu-item-'. $item->ID, $item, $args, $depth);
        $id = $id ? ' id="' . esc_attr($id) . '"' : '';
        
        $output .= $indent . '<li' . $id . $class_names .'>';
        
        $atts = array();
        $atts['title']  = !empty($item->attr_title) ? $item->attr_title : '';
        $atts['target'] = !empty($item->target) ? $item->target : '';
        $atts['rel']    = !empty($item->xfn) ? $item->xfn : '';
        $atts['href']   = !empty($item->url) ? $item->url : '';
        
        // Check for icon in description field
        $has_icon = false;
        $icon_class = '';
        if (!empty($item->description)) {
            // Check if description contains Font Awesome class
            if (strpos($item->description, 'fa-') !== false) {
                $has_icon = true;
                $icon_class = $item->description;
            }
        }
        
        $atts = apply_filters('nav_menu_link_attributes', $atts, $item, $args, $depth);
        
        $attributes = '';
        foreach ($atts as $attr => $value) {
            if (!empty($value)) {
                $value = ('href' === $attr) ? esc_url($value) : esc_attr($value);
                $attributes .= ' ' . $attr . '="' . $value . '"';
            }
        }
        
        $item_output = $args->before;
        
        // If item has icon, create separate icon link with spacing
        if ($has_icon && $depth === 0 && isset($args->theme_location) && $args->theme_location === 'top-menu') {
            $item_output .= '<a class="' . esc_attr($icon_class) . ' hover:text-primary mr-2"' . $attributes . '></a>';
        }
        
        // Add styling classes for top menu items (depth 0) - uk-btn, font-bold (hover from CSS)
        $link_classes = '';
        if ($depth === 0 && isset($args->theme_location) && $args->theme_location === 'top-menu') {
            $link_classes = ' class="uk-btn uk-btn-text font-bold';
            // Hide text on mobile if icon exists (matches Hugo)
            if ($has_icon) {
                $link_classes .= ' hidden sm:inline-block';
            }
            $link_classes .= '"';
        }
        
        $item_output .= '<a'. $attributes . $link_classes .'>';
        $item_output .= $args->link_before . apply_filters('the_title', $item->title, $item->ID) . $args->link_after;
        $item_output .= '</a>';
        $item_output .= $args->after;
        
        $output .= apply_filters('walker_nav_menu_start_el', $item_output, $item, $depth, $args);
    }
    
    /**
     * Starts the list before the elements are added.
     *
     * @param string   $output Used to append additional content (passed by reference).
     * @param int      $depth  Depth of menu item. Used for padding.
     * @param stdClass $args   An object of wp_nav_menu() arguments.
     */
    public function start_lvl(&$output, $depth = 0, $args = null) {
        $indent = str_repeat("\t", $depth);
        $output .= "\n$indent<ul class=\"sub-menu NoListView\">\n";
    }
}
