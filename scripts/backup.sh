#!/bin/bash
# M-TAI Database Backup Script
# Run daily via cron: 0 2 * * * /var/www/html/scripts/backup.sh

BACKUP_DIR="/var/www/html/storage/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/mtai_backup_$TIMESTAMP.sql.gz"

mkdir -p "$BACKUP_DIR"

# Export database
mysqldump -h "$DB_HOST" -u "$DB_USERNAME" -p"$DB_PASSWORD" "$DB_DATABASE" | gzip > "$BACKUP_FILE"

# Keep only last 30 days
find "$BACKUP_DIR" -name "mtai_backup_*.sql.gz" -mtime +30 -delete

echo "Backup completed: $BACKUP_FILE"
