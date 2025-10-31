</main><!-- #main-content -->

<footer class="bg-light pl-3 pr-3">
    <div class="container">
        <div class="items-center py-8">
            <!-- Logo -->
            <div class="mb-8 text-center lg:mb-0">
                <?php if (has_custom_logo()) : ?>
                    <?php 
                    // Get custom logo with proper classes applied
                    $custom_logo_id = get_theme_mod('custom_logo');
                    $logo = wp_get_attachment_image($custom_logo_id, 'full', false, array(
                        'class' => 'custom-logo',
                        'alt' => get_bloginfo('name'),
                    ));
                    ?>
                    <a class="inline-block" href="<?php echo esc_url(home_url('/')); ?>">
                        <?php echo $logo; ?>
                    </a>
                <?php else : ?>
                    <a class="inline-block" href="<?php echo esc_url(home_url('/')); ?>">
                        <h2 class="site-title"><?php bloginfo('name'); ?></h2>
                    </a>
                <?php endif; ?>
            </div>
            
            <!-- Footer Menu -->
            <?php if (has_nav_menu('footer-menu')) : ?>
                <div class="mb-8 text-center lg:mb-0">
                    <?php
                    wp_nav_menu(array(
                        'theme_location' => 'footer-menu',
                        'container' => false,
                        'menu_class' => '',
                        'items_wrap' => '<ul>%3$s</ul>',
                        'walker' => new Monte_Menu_Walker(),
                        'depth' => 1,
                    ));
                    ?>
                </div>
            <?php endif; ?>
            
            <!-- Social Media Links -->
            <?php
            $social_links = array(
                'facebook' => get_theme_mod('monte_facebook_url', ''),
                'instagram' => get_theme_mod('monte_instagram_url', ''),
                'twitter' => get_theme_mod('monte_twitter_url', ''),
            );
            $has_social = array_filter($social_links);
            
            if ($has_social) :
            ?>
                <div class="mb-8 text-center lg:mb-0 lg:mt-0 lg:text-right">
                    <ul class="flex justify-center text-monte text-xl mt-2">
                        <?php if ($social_links['facebook']) : ?>
                            <li>
                                <a target="_blank" aria-label="Facebook" rel="nofollow noopener" href="<?php echo esc_url($social_links['facebook']); ?>">
                                    <i class="fab fa-facebook mx-6"></i>
                                </a>
                            </li>
                        <?php endif; ?>
                        <?php if ($social_links['instagram']) : ?>
                            <li>
                                <a target="_blank" aria-label="Instagram" rel="nofollow noopener" href="<?php echo esc_url($social_links['instagram']); ?>">
                                    <i class="fab fa-instagram mx-6"></i>
                                </a>
                            </li>
                        <?php endif; ?>
                        <?php if ($social_links['twitter']) : ?>
                            <li>
                                <a target="_blank" aria-label="Twitter" rel="nofollow noopener" href="<?php echo esc_url($social_links['twitter']); ?>">
                                    <i class="fab fa-twitter mx-6"></i>
                                </a>
                            </li>
                        <?php endif; ?>
                    </ul>
                </div>
            <?php endif; ?>
        </div>
    </div>
    
    <!-- Copyright -->
    <div class="border-border border-t py-7">
        <div class="text-text-light container text-center">
            <p>&copy; <?php echo date('Y'); ?> <?php bloginfo('name'); ?>. <?php _e('Alle Rechte vorbehalten.', 'monte-theme'); ?></p>
        </div>
    </div>
</footer>
</div><!-- #page -->

<?php wp_footer(); ?>
</body>
</html>
