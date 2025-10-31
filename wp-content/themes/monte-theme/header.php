<!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
    <meta charset="<?php bloginfo('charset'); ?>">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <?php wp_head(); ?>
</head>
<body <?php body_class(); ?>>
<?php wp_body_open(); ?>
<div id="page">

<div class="pl-3 pr-3">
    <header>
        <div class="container pr-0" style="background-image: url(<?php echo get_template_directory_uri(); ?>/assets/images/header-zaun.jpg);background-size: cover;background-position: center center;background-repeat: no-repeat;">
            <!-- logo -->
            <div class="justify-self-end">
                <?php if (has_custom_logo()) : ?>
                    <?php 
                    // Get custom logo with proper classes applied
                    $custom_logo_id = get_theme_mod('custom_logo');
                    $logo = wp_get_attachment_image($custom_logo_id, 'full', false, array(
                        'class' => 'custom-logo',
                        'alt' => get_bloginfo('name'),
                    ));
                    ?>
                    <a id="logo-link" class="block pt-2 pb-2 pr-2" href="<?php echo esc_url(home_url('/')); ?>">
                        <?php echo $logo; ?>
                    </a>
                <?php else : ?>
                    <a id="logo-link" class="block pt-2 pb-2 pr-2" href="<?php echo esc_url(home_url('/')); ?>">
                        <h1 class="site-title"><?php bloginfo('name'); ?></h1>
                    </a>
                <?php endif; ?>
            </div>
        </div>
    </header>
    
    <!-- Sticky Top Navigation -->
    <div class="container sticky top-0 bg-light z-50 shadow-lg text-monte">
        <?php if (has_nav_menu('top-menu')) : ?>
            <ul class="flex flex-row justify-between navbar-nav order-3 w-full space-x-2 pb-0 xl:space-x-8">
                <div class="flex flex-row items-center">
                    <li class="text-2xl m-3">
                        <a class="fa fa-bars font-bold" href="#mymenu" id="mobile-menu-toggle"></a>
                    </li>
                </div>
                <div class="flex flex-row items-center">
                    <?php
                    wp_nav_menu(array(
                        'theme_location' => 'top-menu',
                        'container' => false,
                        'items_wrap' => '%3$s',
                        'walker' => new Monte_Menu_Walker(),
                        'link_before' => '',
                        'link_after' => '',
                    ));
                    ?>
                </div>
            </ul>
        <?php endif; ?>
    </div>
</div>

<!-- Mobile/Main Menu (hidden by default) -->
<?php if (has_nav_menu('main-menu')) : ?>
    <nav id="mymenu" class="hidden">
        <?php
        wp_nav_menu(array(
            'theme_location' => 'main-menu',
            'menu_class' => 'NoListView',
            'container' => false,
            'walker' => new Monte_Menu_Walker(),
        ));
        ?>
    </nav>
<?php endif; ?>

<main id="main-content" class="site-main">
