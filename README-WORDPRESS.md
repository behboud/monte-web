# WordPress Migration Environment

This directory contains the Docker setup for migrating the Monte-Web Hugo site to WordPress.

## Quick Start

1. **Start the environment:**

   ```bash
   docker-compose up -d
   ```

2. **Run the WordPress setup script:**

   ```bash
   ./setup-wordpress.sh
   ```

3. **Access your sites:**
   - WordPress: http://localhost:8080
   - WordPress Admin: http://localhost:8080/wp-admin/
   - phpMyAdmin: http://localhost:8081

## Services

### WordPress (Port 8080)

- **Image**: Custom WordPress with WP-CLI
- **Database**: MySQL 8.0
- **Plugins**: ACF, Contact Form 7, Yoast SEO, Classic Editor, Custom Post Type UI
- **Language**: German (de_DE)

### MySQL Database (Port 3306)

- **Database**: wordpress
- **User**: wordpress
- **Password**: wordpress
- **Root Password**: rootpassword

### phpMyAdmin (Port 8081)

- **User**: wordpress
- **Password**: wordpress

## Directory Structure

```
monte-web/
├── docker-compose.yml          # Main Docker Compose configuration
├── docker-compose.override.yml # Development overrides
├── Dockerfile.wordpress        # Custom WordPress container
├── wp-config.php              # WordPress configuration
├── .env                       # Environment variables
├── setup-wordpress.sh         # Setup script
├── wp-content/                # WordPress content (themes, plugins, uploads)
│   ├── themes/               # Custom themes
│   ├── plugins/              # Custom plugins
│   └── uploads/              # Media uploads
├── content-migration/         # Migration scripts and data
│   ├── scripts/              # Migration scripts
│   ├── data/                 # Migration data
│   └── logs/                 # Migration logs
└── uploads/                  # Persistent uploads volume
```

## Development Workflow

### Starting the Environment

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

### WordPress CLI Usage

```bash
# Access WordPress CLI
docker-compose exec wordpress wp

# Example commands
docker-compose exec wordpress wp plugin list
docker-compose exec wordpress wp theme list
docker-compose exec wordpress wp post list
```

### Theme Development

1. Create your theme in `wp-content/themes/your-theme/`
2. The theme directory is volume-mounted for live editing
3. Activate your theme via WordPress admin or CLI:
   ```bash
   docker-compose exec wordpress wp theme activate your-theme
   ```

### Database Management

- Use phpMyAdmin at http://localhost:8081
- Or use WP-CLI for database operations:
  ```bash
  docker-compose exec wordpress wp db export backup.sql
  docker-compose exec wordpress wp db import backup.sql
  ```

## Migration Process

### Phase 1: Content Migration

1. Export Hugo content using the migration scripts
2. Import content into WordPress using WP-CLI
3. Configure custom post types and taxonomies
4. Set up Advanced Custom Fields

### Phase 2: Theme Development

1. Convert Hugo layouts to WordPress templates
2. Migrate Tailwind CSS to WordPress theme
3. Implement navigation and responsive design
4. Convert JavaScript functionality

### Phase 3: Testing & Deployment

1. Test all functionality locally
2. Optimize performance
3. Deploy to production environment

## Useful Commands

### Docker Management

```bash
# Rebuild containers
docker-compose build --no-cache

# Restart specific service
docker-compose restart wordpress

# View container status
docker-compose ps

# Clean up
docker-compose down -v --remove-orphans
```

### WordPress Management

```bash
# Update WordPress core
docker-compose exec wordpress wp core update

# Install plugin
docker-compose exec wordpress wp plugin install plugin-name

# Activate theme
docker-compose exec wordpress wp theme activate theme-name

# Create backup
docker-compose exec wordpress wp db export backup.sql
```

### Content Migration

```bash
# Export all content
docker-compose exec wordpress wp export --dir=/var/www/html/content-migration/data/

# Import content
docker-compose exec wordpress wp import content.xml --authors=create

# Regenerate thumbnails
docker-compose exec wordpress wp media regenerate --yes
```

## Troubleshooting

### Common Issues

1. **Port conflicts**: Change ports in docker-compose.yml if 8080/8081 are in use
2. **Permission issues**: Ensure proper file permissions on wp-content directory
3. **Database connection**: Check MySQL container is running and accessible
4. **Plugin conflicts**: Deactivate plugins one by one to identify issues

### Logs and Debugging

```bash
# View WordPress logs
docker-compose logs wordpress

# View MySQL logs
docker-compose logs db

# Enable WordPress debug mode
docker-compose exec wordpress wp config set WP_DEBUG true --raw
```

## Security Notes

- Default admin credentials: `admin` / `admin123`
- Change passwords in production
- Use environment variables for sensitive data
- Enable SSL in production
- Keep WordPress and plugins updated

## Next Steps

1. Complete Phase 1 setup (✅ Docker environment)
2. Move to Phase 2: Content Structure Migration
3. Develop custom WordPress theme
4. Migrate Hugo content to WordPress
5. Test and deploy to production

For detailed migration steps, see the AGENTS.md file.
