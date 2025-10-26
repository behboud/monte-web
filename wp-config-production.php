<?php
/**
 * WordPress Production Configuration
 * Montessorischule Gilching
 * 
 * This is the production wp-config.php with security hardening.
 * DO NOT use this file directly in development!
 * 
 * @package WordPress
 */

// ** Database settings - You can get this info from your web host ** //
/** The name of the database for WordPress */
define( 'DB_NAME', getenv('WORDPRESS_DB_NAME') ?: 'wordpress_db' );

/** Database username */
define( 'DB_USER', getenv('WORDPRESS_DB_USER') ?: 'wordpress' );

/** Database password */
define( 'DB_PASSWORD', getenv('WORDPRESS_DB_PASSWORD') ?: 'CHANGE_THIS_PASSWORD' );

/** Database hostname */
define( 'DB_HOST', getenv('WORDPRESS_DB_HOST') ?: 'localhost' );

/** Database charset to use in creating database tables. */
define( 'DB_CHARSET', 'utf8mb4' );

/** The database collate type. Don't change this if in doubt. */
define( 'DB_COLLATE', '' );

// ** Custom table prefix ** //
$table_prefix = getenv('WORDPRESS_TABLE_PREFIX') ?: 'wp_monte_';

/**
 * Authentication unique keys and salts.
 *
 * IMPORTANT: Generate new keys at: https://api.wordpress.org/secret-key/1.1/salt/
 * Replace these values before deploying to production!
 *
 * @since 2.6.0
 */
define('AUTH_KEY',         '.Uc<mL2-vV%+M!H`+Bipgj+f+TsF^]z4n)AqDPx{{s5(1n+/}VI|5kY3|SQM#f#o');
define('SECURE_AUTH_KEY',  '<nJ[lS3,@!M#)-E>8~_32G/lHf(3fe|F@eWE,m!Etd_*O(9CLhK>1)]T{S5HC4^^');
define('LOGGED_IN_KEY',    '{q+Jlf-0m(+rk7+*+dI$q=QFQ29U+~9bxKFupfOQ=6a=H51~`h1be9T-w^lmHHOr');
define('NONCE_KEY',        ' 9+W7tg^[f9+W$ZV.a3:~ ir$Qt{i:]%%b4|<4_tvfVGx@l`/PY4EsOo(]^zYf|^');
define('AUTH_SALT',        'sJs|;i?):$LbZ?`g#~yOc!Q(lx|2ZZIHg0JZ[uGS&cC.^nK/A1^M*+]If_ja?4~p');
define('SECURE_AUTH_SALT', 'W;1W~wTEbdW0po{L6|K(td,Fe`!ZIQIr5LrV#fAU`?tFh,Qr_kDfhvA|Tht|$D:x');
define('LOGGED_IN_SALT',   'IzoWu}GKd_~#1a[=m+opbS$6K2rb-+lrRNWzJ0HwlmchNK`~qy&0`SeXy^}OyB@6');
define('NONCE_SALT',       'pi_v:~Av6Y&H /dHe|+P+a|@uPN4Z1n+ZKR+}/btGB/X@1V2Q7]sJd:YZT:9IU3$');

/**
 * WordPress Database Table prefix.
 */
$table_prefix = 'wp_monte_';

/**
 * Production Environment Configuration
 */
define( 'WP_ENVIRONMENT_TYPE', 'production' );

/**
 * For developers: WordPress debugging mode.
 * Disabled in production, but logs are kept for troubleshooting.
 */
define( 'WP_DEBUG', false );
define( 'WP_DEBUG_LOG', true );
define( 'WP_DEBUG_DISPLAY', false );
@ini_set( 'display_errors', 0 );

/**
 * Security Settings
 */
// Disable file editing from WordPress admin
define( 'DISALLOW_FILE_EDIT', true );

// Force SSL for admin area
define( 'FORCE_SSL_ADMIN', true );

// Disable plugin and theme file modifications
define( 'DISALLOW_FILE_MODS', false ); // Set to true after initial setup

/**
 * Performance Settings
 */
define( 'WP_MEMORY_LIMIT', '256M' );
define( 'WP_MAX_MEMORY_LIMIT', '512M' );

// Enable caching
define( 'WP_CACHE', true );

// Optimize script loading
define( 'COMPRESS_CSS', true );
define( 'COMPRESS_SCRIPTS', true );
define( 'CONCATENATE_SCRIPTS', false ); // Can cause issues with some plugins

/**
 * Update Settings
 */
define( 'AUTOMATIC_UPDATER_DISABLED', true );
define( 'WP_AUTO_UPDATE_CORE', false );

/**
 * Multisite settings (disabled)
 */
define( 'WP_ALLOW_MULTISITE', false );

/**
 * Cron settings
 * Consider setting up system cron for better performance
 */
define( 'DISABLE_WP_CRON', false );
define( 'ALTERNATE_WP_CRON', false );

/**
 * WordPress URL settings
 * Update these to match your production domain
 */
define( 'WP_HOME', getenv('WP_HOME') ?: 'https://montessorischule-gilching.de' );
define( 'WP_SITEURL', getenv('WP_SITEURL') ?: 'https://montessorischule-gilching.de' );

/**
 * File system settings
 */
define( 'FS_METHOD', 'direct' );

/**
 * Language settings
 */
define( 'WPLANG', 'de_DE' );

/**
 * Upload settings
 */
define( 'UPLOADS', 'wp-content/uploads' );

/**
 * Hide WordPress version from headers and feeds
 */
function monte_remove_version() {
	return '';
}
add_filter('the_generator', 'monte_remove_version');

/**
 * Limit post revisions for database optimization
 */
define( 'WP_POST_REVISIONS', 5 );

/**
 * Set autosave interval (in seconds)
 */
define( 'AUTOSAVE_INTERVAL', 300 );

/**
 * Trash cleanup (days before permanent deletion)
 */
define( 'EMPTY_TRASH_DAYS', 30 );

/**
 * Cookie settings (optional, for multi-domain setup)
 */
// define( 'COOKIE_DOMAIN', '.montessorischule-gilching.de' );

/* That's all, stop editing! Happy publishing. */

/** Absolute path to the WordPress directory. */
if ( ! defined( 'ABSPATH' ) ) {
	define( 'ABSPATH', __DIR__ . '/' );
}

/** Sets up WordPress vars and included files. */
require_once ABSPATH . 'wp-settings.php';
