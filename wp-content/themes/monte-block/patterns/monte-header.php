<?php
/**
 * Title: Monte Header
 * Slug: monte-block/header
 * Categories: header
 * Block Types: core/template-part/header
 */
?>
<!-- wp:group {"align":"full","layout":{"type":"constrained"}} -->
<div class="wp-block-group alignfull">
	<!-- wp:cover {"url":"<?php echo esc_url( get_template_directory_uri() ); ?>/assets/images/header-bg.webp","dimRatio":0,"align":"full","alt":"Montessori Gilching school header background"} -->
	<div class="wp-block-cover alignfull">
		<span aria-hidden="true" class="wp-block-cover__background has-background-dim-0 has-background-dim"></span>
		<img class="wp-block-cover__image-background" alt="Montessori Gilching school header background" src="<?php echo esc_url( get_template_directory_uri() ); ?>/assets/images/header-bg.webp" data-object-fit="cover"/>
		<div class="wp-block-cover__inner-container">
			<!-- wp:site-logo {"align":"right","width":200} /-->
		</div>
	</div>
	<!-- /wp:cover -->

	<!-- wp:group {"backgroundColor":"accent-5","textColor":"contrast","align":"full","layout":{"type":"flex","justifyContent":"left"}} -->
	<div class="wp-block-group alignfull has-contrast-color has-accent-5-background-color">
		<!-- wp:navigation {"overlayMenu":"always","icon":"menu"} -->
			<!-- wp:navigation-link {"label":"NEWS","url":"#"} /-->
			<!-- wp:navigation-link {"label":"TERMINE","url":"#"} /-->
			<!-- wp:navigation-link {"label":"ÜBER UNS","url":"#"} /-->
			<!-- wp:navigation-link {"label":"KONTAKT","url":"#"} /-->
		<!-- /wp:navigation -->
	</div>
	<!-- /wp:group -->
</div>
<!-- /wp:group -->
