#!/bin/bash
set -e

export PORT="${PORT:-8080}"
envsubst '${PORT}' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf

# Remove default nginx.conf to avoid conflicts with our server block
rm -f /etc/nginx/nginx.conf

# Ensure storage directories exist and have correct permissions
mkdir -p /var/www/html/storage/framework/{sessions,views,cache}
mkdir -p /var/www/html/storage/logs
mkdir -p /var/www/html/bootstrap/cache
chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache
chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache

# Wait for Cloud SQL proxy to be ready
if [ -n "$DB_HOST" ]; then
    echo "Waiting for database connection..."
    for i in $(seq 1 30); do
        if php -r "
            try {
                new PDO('mysql:host=${DB_HOST};port=${DB_PORT}', '${DB_USERNAME}', '${DB_PASSWORD}', [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
                exit(0);
            } catch (Exception \$e) {
                exit(1);
            }
        " 2>/dev/null; then
            echo "Database ready!"
            break
        fi
        echo "Attempt $i/30 - waiting for database..."
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
