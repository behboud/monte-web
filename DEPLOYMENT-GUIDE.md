# Monte-Web Production Deployment Guide

**Montessorischule Gilching - WordPress Migration**  
**Document Version:** 1.0  
**Last Updated:** 2025-10-26

---

## Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Security Configuration](#security-configuration)
3. [Performance Optimization](#performance-optimization)
4. [Backup Configuration](#backup-configuration)
5. [Monitoring Setup](#monitoring-setup)
6. [Deployment Process](#deployment-process)
7. [Post-Deployment Verification](#post-deployment-verification)
8. [Rollback Procedure](#rollback-procedure)
9. [Troubleshooting](#troubleshooting)

---

## Pre-Deployment Checklist

Before deploying to production, ensure all items are completed:

### Security

- [ ] Changed admin password from default
- [ ] Changed database passwords (root and WordPress user)
- [ ] Generated new WordPress security keys in wp-config.php
- [ ] Configured SSL certificate (Let's Encrypt recommended)
- [ ] Updated `wp-config-production.php` with production domain
- [ ] Set `DISALLOW_FILE_EDIT` to `true` in wp-config.php
- [ ] Disabled WordPress version display
- [ ] Configured proper file permissions (644 files, 755 directories)

### Configuration

- [ ] Updated `.env.production` with production credentials
- [ ] Configured production database connection
- [ ] Updated `WP_HOME` and `WP_SITEURL` to production domain
- [ ] Tested database connection
- [ ] Configured email/SMTP settings
- [ ] Set up cron jobs

### Content & Testing

- [ ] All content migrated and verified
- [ ] All images displaying correctly
- [ ] Navigation menus working
- [ ] Contact forms tested
- [ ] All URL redirects configured
- [ ] 404 page tested
- [ ] Mobile responsiveness verified

### Performance

- [ ] Compiled production assets (CSS/JS)
- [ ] Installed caching plugin
- [ ] Configured CDN (optional)
- [ ] Optimized images
- [ ] Configured browser caching

---

## Security Configuration

### 1. Change Default Passwords

**Admin Password:**

```bash
# SSH into production server
ssh user@production-server.com

# Change admin password via WP-CLI
wp user update admin --user_pass=NEW_STRONG_PASSWORD --allow-root
```

**Database Password:**

```bash
# Connect to MySQL
mysql -u root -p

# Change WordPress user password
ALTER USER 'wordpress'@'localhost' IDENTIFIED BY 'NEW_STRONG_PASSWORD';
FLUSH PRIVILEGES;
EXIT;

# Update wp-config.php with new password
```

### 2. Generate New Security Keys

Visit https://api.wordpress.org/secret-key/1.1/salt/ and replace keys in `wp-config-production.php`

### 3. File Permissions

Run the security configuration script:

```bash
# Copy the script to your production server
scp configure-security.sh user@production-server.com:/tmp/

# SSH to server and run
ssh user@production-server.com
sudo WP_PATH=/var/www/html WP_USER=www-data WP_GROUP=www-data /tmp/configure-security.sh
```

This script will:

- Set ownership to web server user (www-data)
- Set directory permissions to 755
- Set file permissions to 644
- Secure wp-config.php (600)
- Configure uploads directory
- Create .htaccess protection

### 4. Install Security Plugin

**Recommended: Wordfence Security**

```bash
# Install Wordfence
wp plugin install wordfence --activate --allow-root

# Configure Wordfence
# Visit: WordPress Admin > Wordfence > All Options
# Enable:
# - Login Security
# - Two-Factor Authentication
# - Rate Limiting
# - Advanced Comment SPAM Filtering
```

**Alternative: Sucuri Security**

```bash
wp plugin install sucuri-scanner --activate --allow-root
```

### 5. SSL/HTTPS Configuration

**Let's Encrypt (Free SSL):**

```bash
# Install Certbot
sudo apt-get update
sudo apt-get install certbot python3-certbot-apache

# Get certificate
sudo certbot --apache -d montessorischule-gilching.de -d www.montessorischule-gilching.de

# Auto-renewal is configured automatically
# Test renewal:
sudo certbot renew --dry-run
```

**Update wp-config.php:**

```php
define('FORCE_SSL_ADMIN', true);
```

**Update .htaccess to force HTTPS:**

```apache
# Force HTTPS
<IfModule mod_rewrite.c>
RewriteEngine On
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
</IfModule>
```

### 6. Disable XML-RPC (if not needed)

Add to wp-config.php:

```php
add_filter('xmlrpc_enabled', '__return_false');
```

Or via plugin:

```bash
wp plugin install disable-xml-rpc --activate --allow-root
```

### 7. Limit Login Attempts

```bash
wp plugin install limit-login-attempts-reloaded --activate --allow-root
```

Configure:

- Max login attempts: 3
- Lockout duration: 60 minutes
- Email notification: On

---

## Performance Optimization

### 1. Caching Plugin Installation

**Option A: WP Rocket (Premium, Recommended)**

1. Purchase from https://wp-rocket.me/
2. Download plugin zip file
3. Install:

```bash
wp plugin install /path/to/wp-rocket.zip --activate --allow-root
```

4. Configure:

- **Cache:** Enable page caching
- **File Optimization:** Minify CSS, Minify JavaScript, Combine CSS files
- **Media:** Enable Lazy Load for images
- **Preload:** Enable preload cache
- **Advanced Rules:** Configure as needed
- **Database:** Enable automatic cleanup (weekly)
- **CDN:** Configure if using CDN

**Option B: W3 Total Cache (Free)**

```bash
# Install W3 Total Cache
wp plugin install w3-total-cache --activate --allow-root
```

Configuration:

```bash
# Enable page cache
wp w3-total-cache option set pgcache.enabled true --allow-root

# Enable browser cache
wp w3-total-cache option set browsercache.enabled true --allow-root

# Enable minify
wp w3-total-cache option set minify.enabled true --allow-root

# Flush all caches
wp w3-total-cache flush all --allow-root
```

**Option C: WP Super Cache (Free, Simple)**

```bash
wp plugin install wp-super-cache --activate --allow-root
```

Configure via WordPress Admin > Settings > WP Super Cache

### 2. Redis/Memcached Configuration

**Redis (Recommended):**

```bash
# Install Redis
sudo apt-get install redis-server php-redis

# Start Redis
sudo systemctl start redis-server
sudo systemctl enable redis-server

# Install WordPress Redis plugin
wp plugin install redis-cache --activate --allow-root

# Enable Redis cache
wp redis enable --allow-root
```

Add to wp-config.php:

```php
define('WP_REDIS_HOST', '127.0.0.1');
define('WP_REDIS_PORT', 6379);
define('WP_CACHE_KEY_SALT', 'monte_');
```

### 3. Image Optimization

**ShortPixel (Recommended):**

```bash
wp plugin install shortpixel-image-optimiser --activate --allow-root
```

Configure:

1. Get API key from https://shortpixel.com/
2. WordPress Admin > Settings > ShortPixel
3. Set compression level: Lossy (recommended)
4. Enable: Convert PNG to JPG, Remove EXIF data
5. Bulk optimize existing images

**Alternative: Imagify:**

```bash
wp plugin install imagify --activate --allow-root
```

### 4. CDN Configuration (Cloudflare)

**Cloudflare Setup:**

1. Sign up at https://cloudflare.com/
2. Add your domain
3. Update nameservers at your domain registrar
4. Configure Cloudflare settings:
   - SSL: Full (strict)
   - Caching Level: Standard
   - Browser Cache TTL: 4 hours
   - Auto Minify: Check CSS, JavaScript, HTML
   - Brotli: On

**WordPress Integration:**

```bash
wp plugin install cloudflare --activate --allow-root
```

Configure via WordPress Admin > Settings > Cloudflare

### 5. Database Optimization

```bash
# Optimize database tables
wp db optimize --allow-root

# Clean up revisions (keep last 5)
wp post delete $(wp post list --post_type=revision --format=ids --allow-root) --allow-root

# Clean up auto-drafts
wp post delete $(wp post list --post_status=auto-draft --format=ids --allow-root) --allow-root

# Clean up spam and trash comments
wp comment delete $(wp comment list --status=spam --format=ids --allow-root) --allow-root
wp comment delete $(wp comment list --status=trash --format=ids --allow-root) --allow-root
```

Add to crontab for weekly cleanup:

```bash
# Edit crontab
crontab -e

# Add weekly database optimization (Sunday 3 AM)
0 3 * * 0 wp db optimize --path=/var/www/html --allow-root
```

### 6. Gzip Compression

Add to .htaccess:

```apache
# Gzip compression
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css text/javascript application/javascript application/x-javascript application/json
</IfModule>
```

### 7. Browser Caching

Add to .htaccess:

```apache
# Browser caching
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType image/jpg "access plus 1 year"
  ExpiresByType image/jpeg "access plus 1 year"
  ExpiresByType image/gif "access plus 1 year"
  ExpiresByType image/png "access plus 1 year"
  ExpiresByType image/svg+xml "access plus 1 year"
  ExpiresByType text/css "access plus 1 month"
  ExpiresByType application/pdf "access plus 1 month"
  ExpiresByType application/javascript "access plus 1 month"
  ExpiresByType application/x-javascript "access plus 1 month"
  ExpiresByType image/x-icon "access plus 1 year"
  ExpiresDefault "access plus 2 days"
</IfModule>
```

### 8. PHP-FPM Optimization (if applicable)

Edit `/etc/php/8.x/fpm/pool.d/www.conf`:

```ini
pm = dynamic
pm.max_children = 50
pm.start_servers = 5
pm.min_spare_servers = 5
pm.max_spare_servers = 35
pm.max_requests = 500
```

Restart PHP-FPM:

```bash
sudo systemctl restart php8.x-fpm
```

---

## Backup Configuration

### 1. Database Backups

**Automated MySQL Backup Script:**

Create `/usr/local/bin/backup-monte-db.sh`:

```bash
#!/bin/bash
# Monte-Web Database Backup Script

BACKUP_DIR="/var/backups/monte-web/database"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DB_NAME="wordpress_db"
DB_USER="wordpress"
DB_PASS="YOUR_DB_PASSWORD"
RETENTION_DAYS=30

# Create backup directory
mkdir -p ${BACKUP_DIR}

# Backup database
mysqldump -u ${DB_USER} -p${DB_PASS} ${DB_NAME} | gzip > ${BACKUP_DIR}/monte-db-${TIMESTAMP}.sql.gz

# Delete old backups (older than RETENTION_DAYS)
find ${BACKUP_DIR} -name "monte-db-*.sql.gz" -mtime +${RETENTION_DAYS} -delete

# Log
echo "$(date): Database backup completed: monte-db-${TIMESTAMP}.sql.gz" >> ${BACKUP_DIR}/backup.log
```

Make executable:

```bash
chmod +x /usr/local/bin/backup-monte-db.sh
```

**Schedule daily backups (3 AM):**

```bash
crontab -e

# Add:
0 3 * * * /usr/local/bin/backup-monte-db.sh
```

### 2. File Backups

**Backup wp-content directory:**

Create `/usr/local/bin/backup-monte-files.sh`:

```bash
#!/bin/bash
# Monte-Web File Backup Script

BACKUP_DIR="/var/backups/monte-web/files"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
WP_PATH="/var/www/html"
RETENTION_DAYS=14

# Create backup directory
mkdir -p ${BACKUP_DIR}

# Backup wp-content
tar -czf ${BACKUP_DIR}/monte-files-${TIMESTAMP}.tar.gz \
    -C ${WP_PATH} \
    wp-content/themes/monte-theme \
    wp-content/plugins \
    wp-content/uploads

# Delete old backups
find ${BACKUP_DIR} -name "monte-files-*.tar.gz" -mtime +${RETENTION_DAYS} -delete

# Log
echo "$(date): File backup completed: monte-files-${TIMESTAMP}.tar.gz" >> ${BACKUP_DIR}/backup.log
```

Make executable and schedule:

```bash
chmod +x /usr/local/bin/backup-monte-files.sh

# Weekly file backups (Sunday 4 AM)
crontab -e
0 4 * * 0 /usr/local/bin/backup-monte-files.sh
```

### 3. WordPress Plugin for Backups

**UpdraftPlus (Recommended):**

```bash
wp plugin install updraftplus --activate --allow-root
```

Configure:

1. WordPress Admin > Settings > UpdraftPlus Backups
2. Choose remote storage: Dropbox, Google Drive, or Amazon S3
3. Schedule:
   - Files: Weekly
   - Database: Daily
4. Retention: Keep 4 weeks
5. Run manual backup to test

**Alternative: BackWPup:**

```bash
wp plugin install backwpup --activate --allow-root
```

### 4. Off-site Backup Storage

**Option A: Rsync to Remote Server:**

```bash
# Create SSH key for passwordless authentication
ssh-keygen -t rsa -b 4096

# Copy to backup server
ssh-copy-id backup-user@backup-server.com

# Rsync backups to remote server
rsync -avz /var/backups/monte-web/ backup-user@backup-server.com:/backups/monte-web/
```

Add to crontab (daily at 5 AM):

```bash
0 5 * * * rsync -avz /var/backups/monte-web/ backup-user@backup-server.com:/backups/monte-web/
```

**Option B: AWS S3:**

```bash
# Install AWS CLI
sudo apt-get install awscli

# Configure AWS credentials
aws configure

# Sync to S3
aws s3 sync /var/backups/monte-web/ s3://monte-web-backups/
```

**Option C: Dropbox:**

```bash
# Install Dropbox Uploader
wget https://raw.githubusercontent.com/andreafabrizi/Dropbox-Uploader/master/dropbox_uploader.sh
chmod +x dropbox_uploader.sh

# Configure (follow prompts)
./dropbox_uploader.sh

# Upload backups
./dropbox_uploader.sh upload /var/backups/monte-web/ /monte-web-backups/
```

### 5. Backup Verification

**Test restore procedure:**

```bash
# Test database restore
gunzip < /var/backups/monte-web/database/monte-db-YYYYMMDD_HHMMSS.sql.gz | mysql -u wordpress -p wordpress_db

# Test file restore
tar -xzf /var/backups/monte-web/files/monte-files-YYYYMMDD_HHMMSS.tar.gz -C /tmp/restore-test/
```

**Schedule monthly restore tests** and document results.

### 6. Backup Monitoring

Create `/usr/local/bin/check-backups.sh`:

```bash
#!/bin/bash
# Check if backups are current

BACKUP_DIR="/var/backups/monte-web"
ALERT_EMAIL="admin@montessorischule-gilching.de"

# Check database backup (should be < 25 hours old)
LATEST_DB=$(find ${BACKUP_DIR}/database -name "*.sql.gz" -mtime -1 | wc -l)
if [ $LATEST_DB -eq 0 ]; then
    echo "WARNING: No recent database backup found!" | mail -s "Monte-Web Backup Alert" ${ALERT_EMAIL}
fi

# Check file backup (should be < 8 days old)
LATEST_FILES=$(find ${BACKUP_DIR}/files -name "*.tar.gz" -mtime -8 | wc -l)
if [ $LATEST_FILES -eq 0 ]; then
    echo "WARNING: No recent file backup found!" | mail -s "Monte-Web Backup Alert" ${ALERT_EMAIL}
fi
```

Schedule daily check:

```bash
0 6 * * * /usr/local/bin/check-backups.sh
```

---

## Monitoring Setup

### 1. Uptime Monitoring

**UptimeRobot (Free):**

1. Sign up at https://uptimerobot.com/
2. Add New Monitor:
   - Type: HTTP(s)
   - URL: https://montessorischule-gilching.de
   - Interval: 5 minutes
3. Configure alerts (email, SMS)
4. Add keyword monitoring (optional): Look for specific text on homepage

**Alternative: Pingdom:**

Sign up at https://pingdom.com/ and configure similar settings.

### 2. Error Logging

**WordPress Debug Log:**

Already configured in `wp-config-production.php`:

```php
define('WP_DEBUG', false);
define('WP_DEBUG_LOG', true);
define('WP_DEBUG_DISPLAY', false);
```

Monitor log file:

```bash
tail -f /var/www/html/wp-content/debug.log
```

**Server Error Logs:**

Monitor Apache/Nginx errors:

```bash
# Apache
tail -f /var/log/apache2/error.log

# Nginx
tail -f /var/log/nginx/error.log
```

**Log rotation:**

Create `/etc/logrotate.d/wordpress`:

```
/var/www/html/wp-content/debug.log {
    daily
    rotate 14
    compress
    delaycompress
    missingok
    notifempty
    create 644 www-data www-data
}
```

### 3. Performance Monitoring

**Query Monitor Plugin:**

Already installed in Phase 1. Access via WordPress Admin > Tools > Query Monitor

Monitor:

- Database queries
- PHP errors
- HTTP requests
- Hook execution times

**Server Performance:**

Install monitoring tools:

```bash
sudo apt-get install htop iotop netstat
```

Monitor resources:

```bash
# CPU and memory
htop

# Disk I/O
iotop

# Network connections
netstat -tupln
```

### 4. Google Analytics

**Install GA:**

```bash
wp plugin install google-analytics-for-wordpress --activate --allow-root
```

Configure:

1. Create GA4 property at https://analytics.google.com/
2. Get Measurement ID
3. WordPress Admin > Insights > Settings
4. Enter Measurement ID
5. Configure tracking (respect German GDPR laws)

### 5. Security Monitoring

**Wordfence Alerts:**

Configure in WordPress Admin > Wordfence > All Options > Alerts:

- Email on new login
- Email on failed login attempts (threshold: 5)
- Email on file changes
- Weekly security scan summary

**File Integrity Monitoring:**

```bash
# Install AIDE
sudo apt-get install aide

# Initialize database
sudo aideinit

# Check for changes
sudo aide --check

# Schedule daily checks
echo "0 2 * * * /usr/bin/aide --check" | sudo crontab -
```

### 6. Application Performance Monitoring (APM)

**New Relic (Optional, Premium):**

1. Sign up at https://newrelic.com/
2. Install PHP agent:

```bash
curl -Ls https://download.newrelic.com/php_agent/release/newrelic-php5-X.X.X-linux.tar.gz | tar -C /tmp -zx
cd /tmp/newrelic-php5-*
sudo ./newrelic-install install
```

3. Configure license key in `/etc/php/8.x/mods-available/newrelic.ini`
4. Restart PHP-FPM

**Alternative: Blackfire.io:**

Profiling tool for PHP performance optimization.

### 7. Status Dashboard

**Create simple status page:**

Create `/var/www/html/status.php` (password protected):

```php
<?php
// Simple status check page
// Password protect this file!

header('Content-Type: application/json');

$status = array(
    'timestamp' => date('Y-m-d H:i:s'),
    'site' => 'online',
    'database' => 'unknown',
    'cache' => 'unknown',
    'disk_space' => disk_free_space('/') / 1024 / 1024 / 1024 . ' GB free'
);

// Check database
try {
    $db = new PDO('mysql:host=localhost;dbname=wordpress_db', 'wordpress', 'password');
    $status['database'] = 'online';
} catch(PDOException $e) {
    $status['database'] = 'offline';
    $status['site'] = 'degraded';
}

// Check Redis cache
if (class_exists('Redis')) {
    try {
        $redis = new Redis();
        $redis->connect('127.0.0.1', 6379);
        $status['cache'] = 'online';
    } catch(Exception $e) {
        $status['cache'] = 'offline';
    }
}

echo json_encode($status, JSON_PRETTY_PRINT);
```

Monitor via cron:

```bash
# Check status every 5 minutes
*/5 * * * * curl -s http://localhost/status.php | grep -q '"site":"online"' || echo "Site down!" | mail -s "Alert" admin@example.com
```

### 8. Email Alert Configuration

**Configure mail sending:**

```bash
# Install mailutils
sudo apt-get install mailutils postfix

# Test
echo "Test email" | mail -s "Test" admin@montessorischule-gilching.de
```

**Or use SMTP relay (recommended):**

```bash
wp plugin install wp-mail-smtp --activate --allow-root
```

Configure with Gmail, SendGrid, or AWS SES.

---

## Deployment Process

### 1. Pre-Deployment

```bash
# On local/staging environment

# Pull latest changes
git pull origin main

# Build assets
cd wp-content/themes/monte-theme
npm install
npm run build
cd ../../..

# Run tests
./test-phase9.sh
```

### 2. Deploy to Production

```bash
# Set production server details
export PROD_SERVER="user@montessorischule-gilching.de"
export PROD_PATH="/var/www/html"

# Dry run first
./deploy.sh --dry-run

# Review output, then deploy
./deploy.sh
```

### 3. Post-Deployment

```bash
# SSH to production server
ssh $PROD_SERVER

# Verify WordPress status
cd /var/www/html
wp core version --allow-root
wp plugin list --allow-root
wp theme list --allow-root

# Clear all caches
wp cache flush --allow-root
wp rewrite flush --allow-root

# Check for errors
tail -50 wp-content/debug.log
```

---

## Post-Deployment Verification

### Automated Checks

```bash
# From local machine
curl -I https://montessorischule-gilching.de
curl -I https://montessorischule-gilching.de/aktuelles/

# Check SSL
curl -vI https://montessorischule-gilching.de 2>&1 | grep -i "SSL"
```

### Manual Checks

- [ ] Homepage loads correctly
- [ ] Navigation menus work
- [ ] News archive displays posts
- [ ] Contact form submits successfully
- [ ] Search functionality works
- [ ] Mobile menu opens/closes
- [ ] All images display
- [ ] No JavaScript console errors
- [ ] SSL certificate valid
- [ ] Site loads in < 2 seconds

### Performance Testing

```bash
# Using curl
time curl -s -o /dev/null https://montessorischule-gilching.de

# Google PageSpeed Insights
# Visit: https://pagespeed.web.dev/
# Enter: https://montessorischule-gilching.de
```

Target scores:

- Performance: > 90
- Accessibility: > 95
- Best Practices: > 90
- SEO: > 95

---

## Rollback Procedure

If deployment issues occur:

```bash
# Rollback to previous version
./deploy.sh --rollback

# Or manually via SSH
ssh $PROD_SERVER
cd /var/www/html
tar -xzf backups/theme-TIMESTAMP.tar.gz
wp cache flush --allow-root
```

---

## Troubleshooting

### Site not loading

1. Check server status:

```bash
systemctl status apache2  # or nginx
systemctl status mysql
```

2. Check error logs:

```bash
tail -100 /var/log/apache2/error.log
tail -100 /var/www/html/wp-content/debug.log
```

3. Verify database connection:

```bash
wp db check --allow-root
```

### Styles not loading

1. Check file permissions:

```bash
ls -la /var/www/html/wp-content/themes/monte-theme/dist/css/
```

2. Clear cache:

```bash
wp cache flush --allow-root
```

3. Verify asset paths in browser developer tools

### Forms not sending

1. Test mail configuration:

```bash
echo "Test" | mail -s "Test" admin@montessorischule-gilching.de
```

2. Check Contact Form 7 logs
3. Install WP Mail SMTP for debugging

### Performance issues

1. Check Query Monitor for slow queries
2. Verify caching is enabled
3. Check server resources:

```bash
htop
df -h
```

4. Optimize database:

```bash
wp db optimize --allow-root
```

---

## Support Contacts

- **Hosting Provider:** [Provider Support]
- **WordPress Support:** https://wordpress.org/support/
- **Theme Developer:** [Your contact]
- **Emergency Contact:** [Emergency phone]

---

## Document Change Log

| Date       | Version | Changes                  | Author     |
| ---------- | ------- | ------------------------ | ---------- |
| 2025-10-26 | 1.0     | Initial deployment guide | Monte Team |
