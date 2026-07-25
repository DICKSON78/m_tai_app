#!/bin/bash
set -e

# Start Cloud SQL Auth Proxy in background if connection name is provided
if [ -n "$CLOUD_SQL_CONNECTION_NAME" ]; then
    echo "Starting Cloud SQL Auth Proxy for ${CLOUD_SQL_CONNECTION_NAME}..."
    /cloud-sql-proxy -instances="${CLOUD_SQL_CONNECTION_NAME}=tcp:3306" -structured_logs &
    PROXY_PID=$!
    # Wait for proxy to be ready
    for i in $(seq 1 30); do
        if php -r "
            try {
                new PDO('mysql:host=127.0.0.1;port=3306', '${DB_USERNAME}', '${DB_PASSWORD}', [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_TIMEOUT => 3]);
                exit(0);
            } catch (Exception \$e) { exit(1); }
        " 2>/dev/null; then
            echo "Cloud SQL proxy ready!"
            break
        fi
        echo "Attempt $i/30 - waiting for proxy..."
        sleep 2
    done
fi

# Ensure storage directories exist and have correct permissions
mkdir -p /var/www/html/storage/framework/{sessions,views,cache}
mkdir -p /var/www/html/storage/logs
mkdir -p /var/www/html/bootstrap/cache
chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache
chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache

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

echo "Starting Nginx on port 8080..."
exec nginx -g 'daemon off;'
