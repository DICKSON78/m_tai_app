# Stage 1: Build Frontend Assets
FROM node:20-alpine AS frontend
WORKDIR /app
COPY package*.json ./
RUN npm ci --legacy-peer-deps
COPY . .
RUN npm run build

# Stage 2: PHP 8.3 FPM + Nginx
FROM php:8.3-fpm-alpine

RUN apk add --no-cache \
    nginx \
    icu-dev \
    libzip-dev \
    libpng-dev \
    libjpeg-turbo-dev \
    freetype-dev \
    oniguruma-dev \
    bash

RUN docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install -j$(nproc) \
        pdo pdo_mysql mbstring zip gd intl bcmath opcache

COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

COPY . /var/www/html
COPY --from=frontend /app/public/build /var/www/html/public/build

RUN composer install --no-dev --optimize-autoloader --no-interaction --no-progress

# Generate APP_KEY if .env doesn't have one
RUN php artisan key:generate --force 2>/dev/null || true

# Replace nginx config
RUN rm -f /etc/nginx/nginx.conf /etc/nginx/conf.d/default.conf
COPY docker/nginx-prod.conf /etc/nginx/nginx.conf

COPY docker/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

RUN chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache \
    && chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache

EXPOSE 8080

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
