#!/bin/bash
set -e

# Ensure storage directories exist and have correct permissions
mkdir -p /var/www/html/storage/framework/{sessions,views,cache}
mkdir -p /var/www/html/storage/logs
mkdir -p /var/www/html/bootstrap/cache
chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache
chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache

# Clear cached config (Cloud Run provides env vars at runtime)
php artisan config:clear 2>/dev/null || true
php artisan route:clear 2>/dev/null || true
php artisan view:clear 2>/dev/null || true

if [ "$APP_ENV" = "production" ]; then
    echo "Caching config for production..."
    php artisan config:cache 2>&1 || true
    php artisan route:cache 2>&1 || true
    php artisan view:cache 2>&1 || true
fi

if [ "$RUN_MIGRATIONS" = "true" ]; then
    echo "Running database migrations..."
    php artisan migrate --force 2>&1 || true
fi

echo "Starting PHP-FPM..."
php-fpm -D

echo "Starting Nginx on port 8080..."
exec nginx -g 'daemon off;'
