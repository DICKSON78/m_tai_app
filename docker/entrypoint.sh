#!/bin/bash
set -e

mkdir -p /var/www/html/storage/framework/{sessions,views,cache}
mkdir -p /var/www/html/storage/logs
mkdir -p /var/www/html/bootstrap/cache
chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache /var/www/html/database
chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache /var/www/html/database
touch /var/www/html/storage/logs/laravel.log
chown www-data:www-data /var/www/html/storage/logs/laravel.log
chmod 664 /var/www/html/storage/logs/laravel.log

echo "DB_HOST=$DB_HOST DB_SOCKET=$DB_SOCKET DB_CONNECTION=$DB_CONNECTION DB_PORT=$DB_PORT"

if [ -n "$DB_SOCKET" ] && [ -S "$DB_SOCKET" ]; then
    echo "Cloud SQL socket ready at $DB_SOCKET"
elif [ -n "$DB_SOCKET" ]; then
    echo "Waiting for Cloud SQL socket at $DB_SOCKET..."
    for i in $(seq 1 30); do
        if [ -S "$DB_SOCKET" ]; then
            echo "Cloud SQL socket ready!"
            break
        fi
        echo "Attempt $i/30 - waiting..."
        sleep 2
    done
fi

php artisan config:clear 2>/dev/null || true
php artisan route:clear 2>/dev/null || true
php artisan view:clear 2>/dev/null || true

if [ "$RUN_MIGRATIONS" = "true" ]; then
    echo "Running database migrations..."
    php artisan migrate --force || true
    echo "Seeding database..."
    php artisan db:seed --force || true
fi

echo "Starting PHP-FPM..."
php-fpm -D

echo "Starting Nginx on port 8080..."
exec nginx -g 'daemon off;'
