<?php
/**
 * The base configuration for WordPress
 *
 * The wp-config.php creation script uses this file during the
 * installation. You don't have to use the web site, you can
 * copy this file to "wp-config.php" and fill in the values.
 *
 * This file contains the following configurations:
 *
 * * Database settings
 * * Secret keys
 * * Database table prefix
 * * ABSPATH
 *
 * @link https://wordpress.org/documentation/article/editing-wp-config-php/
 *
 * @package WordPress
 */

// ** Database settings - You can get this info from your web host ** //
/** The name of the database for WordPress */
define( 'DB_NAME', 'wordpress_db' );

/** Database username */
define( 'DB_USER', 'wordpress' );

/** Database password */
define( 'DB_PASSWORD', 'wp_secure_password_2025' );

/** Database hostname */
define( 'DB_HOST', 'db' );

/** Database charset to use in creating database tables. */
define( 'DB_CHARSET', 'utf8mb4' );

/** The database collate type. Don't change this if in doubt. */
define( 'DB_COLLATE', '' );

// ** Custom table prefix ** //
$table_prefix = 'wp_monte_';

/**
 * Authentication unique keys and salts.
 *
 * Change these to different unique phrases! You can generate these using
 * the {@link https://api.wordpress.org/secret-key/1.1/salt/ WordPress.org secret-key service}.
 *
 * You can change these at any point in time to invalidate all existing cookies.
 * This will force all users to have to log in again.
 *
 * @since 2.6.0
 */
define( 'AUTH_KEY',         'csx(6rM_+cZIuT+aj,[3~ULG<m7&>0Dm?-1+-H<nH|JM|+~DtgL8d>}|VTY(T2Ca' );
define( 'SECURE_AUTH_KEY',  'C~:e9bo[s{-v,S-_AW]Ar{Lb|~oMK4E5n?`ea!5V%g_!s$K0t*T7(mS&pL`>G[3d' );
define( 'LOGGED_IN_KEY',    'm_WR3Oz@nR}CLw$VVFLMuqmxpO!R$KXd|@5lCcQhx(u1[+R9fdLN+:4$]^O_e?Cs' );
define( 'NONCE_KEY',        'k_<sl8i y9lxb)7|!(tw1oC>HVIF!=1*MDCa@W_AYrx}^,F>FZt.n;|4J(bPuni|' );
define( 'AUTH_SALT',        '(+;?L_)*|5r8cRt7RN}h$,^I2ob64J+9-#s$L3OQ+X(Vl)cGGw)b^0`!$c6l@e@P' );
define( 'SECURE_AUTH_SALT', '&;LiMhfMjW;a>oc!E[~GG+0.7RZvmz(0Zst ZF4Z_|1;-fK-M3p3q-sblQPS*vHe' );
define( 'LOGGED_IN_SALT',   'xYI_</|HsFj=^.,Z^XXa,>GFHbpdZB^Q exbHb*BLVj;y:[nNf&}/hB,BCM@vFEa' );
define( 'NONCE_SALT',       '!6h.L=Qk,QZ5tW4Hb1KyhQ4L=iQ&N+=1A^sA lD-G&X>4orU8s+])ap7@yV8JU|X' );

// ** Development settings ** //
define( 'WP_DEBUG', true );
define( 'WP_DEBUG_LOG', true );
define( 'WP_DEBUG_DISPLAY', false );

// ** WordPress URL settings ** //
define( 'WP_HOME', 'http://localhost:8080' );
define( 'WP_SITEURL', 'http://localhost:8080' );

// ** File system settings ** //
define( 'FS_METHOD', 'direct' );

// ** Language settings ** //
define( 'WPLANG', 'de_DE' );

// ** Memory limit ** //
define( 'WP_MEMORY_LIMIT', '256M' );
define( 'WP_MAX_MEMORY_LIMIT', '512M' );

// ** Upload settings ** //
define( 'UPLOADS', 'wp-content/uploads' );

// ** Security settings ** //
define( 'DISALLOW_FILE_EDIT', false );
define( 'FORCE_SSL_ADMIN', false );

// ** Performance settings ** //
define( 'WP_CACHE', false );
define( 'COMPRESS_CSS', false );
define( 'COMPRESS_SCRIPTS', false );
define( 'CONCATENATE_SCRIPTS', false );

// ** Multisite settings (disabled) ** //
define( 'WP_ALLOW_MULTISITE', false );

// ** Cron settings ** //
define( 'DISABLE_WP_CRON', false );
define( 'ALTERNATE_WP_CRON', false );

// ** Update settings ** //
define( 'WP_AUTO_UPDATE_CORE', false );
define( 'AUTOMATIC_UPDATER_DISABLED', true );

// ** Plugin and theme settings ** //
define( 'WP_PLUGIN_DIR', dirname(__FILE__) . '/wp-content/plugins' );
define( 'WP_PLUGIN_URL', 'http://localhost:8080/wp-content/plugins' );

// ** That's all, stop editing! Happy publishing. ** //

/** Absolute path to the WordPress directory. */
if ( ! defined( 'ABSPATH' ) ) {
	define( 'ABSPATH', __DIR__ . '/' );
}

/** Sets up WordPress vars and included files. */
require_once ABSPATH . 'wp-settings.php';