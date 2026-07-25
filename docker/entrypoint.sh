#!/bin/bash
set -e

# Ensure storage directories exist and have correct permissions
mkdir -p /var/www/html/storage/framework/{sessions,views,cache}
mkdir -p /var/www/html/storage/logs
mkdir -p /var/www/html/bootstrap/cache
chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache /var/www/html/database
chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache /var/www/html/database
touch /var/www/html/storage/logs/laravel.log
chown www-data:www-data /var/www/html/storage/logs/laravel.log
chmod 664 /var/www/html/storage/logs/laravel.log

# Always clear and rebuild cache with current env vars
php artisan config:clear 2>/dev/null || true
php artisan route:clear 2>/dev/null || true
php artisan view:clear 2>/dev/null || true

# Debug: print DB_HOST to verify
echo "DB_HOST=$DB_HOST"
echo "DB_CONNECTION=$DB_CONNECTION"
echo "APP_ENV=$APP_ENV"

if [ "$APP_ENV" = "production" ]; then
    echo "Caching config..."
    php artisan config:cache 2>&1 || echo "config:cache failed, continuing without cache"
fi

if [ "$RUN_MIGRATIONS" = "true" ]; then
    echo "Running database migrations..."
    php artisan migrate --force 2>&1 || echo "migrations failed or already up-to-date"
fi

echo "Starting PHP-FPM..."
php-fpm -D

echo "Starting Nginx on port 8080..."
exec nginx -g 'daemon off;'
