#!/bin/sh

# Only wait for database in development mode with MySQL
if [ "${APP_ENVIRONMENT}" = "development" ] && [ "${DB_ENGINE}" = "mysql" ]; then
    echo "Waiting for database..."
    max_retries=30
    counter=0
    while ! python -c "
import sys
import django
from django.db import connections
from django.db.utils import OperationalError
django.setup()
try:
    connections['default'].ensure_connection()
except OperationalError:
    sys.exit(1)
" 2>/dev/null; do
        counter=$((counter+1))
        if [ $counter -gt $max_retries ]; then
            echo "Database connection failed after $max_retries attempts. Exiting."
            exit 1
        fi
        echo "Waiting for database connection... ($counter/$max_retries)"
        sleep 2
    done
    echo "Database is ready."
fi

# Apply migrations if not in test mode and not skipping migrations
if [ "${APP_ENVIRONMENT}" != "test" ] && [ "${SKIP_DJANGO_MIGRATIONS}" != "true" ]; then
    echo "Applying database migrations..."
    python manage.py migrate
else
    if [ "${SKIP_DJANGO_MIGRATIONS}" = "true" ]; then
        echo "Skipping migrations due to SKIP_DJANGO_MIGRATIONS=true"
    fi
fi

# Execute the main command
exec "$@"
