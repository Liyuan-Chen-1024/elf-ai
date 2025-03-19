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

# Apply migrations if not in test mode
if [ "${APP_ENVIRONMENT}" != "test" ]; then
    echo "Applying database migrations..."
    python manage.py migrate
fi

# Create test user only in development
if [ "${APP_ENVIRONMENT}" = "development" ]; then
    echo "Creating test user..."
    python manage.py create_test_user
fi

# Execute the main command
exec "$@"
