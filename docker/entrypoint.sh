#!/bin/bash
set -e

export PORT="${PORT:-8080}"

# Generate nginx config from template
envsubst '${PORT}' < /etc/nginx/nginx.conf.template > /etc/nginx/nginx.conf

# Ensure storage directories exist and have correct permissions
mkdir -p /var/www/html/storage/framework/{sessions,views,cache}
mkdir -p /var/www/html/storage/logs
mkdir -p /var/www/html/bootstrap/cache
chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache
chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache

# Wait for Cloud SQL proxy to be ready (if using Cloud SQL connection)
if [ -n "$DB_HOST" ] && echo "$DB_HOST" | grep -q "/cloudsql/"; then
    echo "Waiting for Cloud SQL connection..."
    for i in $(seq 1 30); do
        if php -r "new PDO('mysql:host=127.0.0.1;port=3306', 'root', ''); exit(0);" 2>/dev/null; then
            echo "Cloud SQL ready!"
            break
        fi
        echo "Attempt $i/30 - waiting for Cloud SQL..."
        sleep 2
    done
fi

if [ "$APP_ENV" = "production" ]; then
    echo "Optimizing Laravel for production..."
    php artisan config:cache || true
    php artisan route:cache || true
    php artisan view:cache || true
fi

if [ "$RUN_MIGRATIONS" = "true" ]; then
    echo "Running database migrations..."
    php artisan migrate --force || true
fi

echo "Starting PHP-FPM..."
php-fpm -D

echo "Starting Nginx on port ${PORT}..."
exec nginx -g 'daemon off;'
