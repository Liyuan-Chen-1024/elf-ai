#!/bin/sh

# Apply database migrations
echo "Applying database migrations..."
python manage.py migrate

# Create test user in development
echo "Creating test user..."
python manage.py create_test_user

# Execute the main command (usually runserver)
exec "$@" 